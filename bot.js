const tmi = require('tmi.js');
const { exec } = require("child_process");
require('dotenv').config();

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

let votes = {
  usernames: [],
  long: 0,
  short: 0
};

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  const commandName = msg.trim();

  if (commandName === '!help') {
      client.say(target, `https://github.com/dni/twitch-trading-bot/blob/main/README.md`);
  }

  if (commandName.indexOf('!vote') === 0) {
    args = commandName.split(" ");
    if (args.length === 1) {
      client.say(target, `current votes: long: ${votes.long} short ${votes.short}`);
      client.say(target, `users already voted: ${votes.usernames.join(",")}`);
    }
    if (args.length > 1) {
      side = args[1];
      // has user already voted?
      if (votes.usernames.indexOf(context.username) === -1) {
        // sanity check
        if (side === "long" || side === "short") {
          votes[side] += 1;
          votes.usernames.push(context.username);
          client.say(target, `${context.username} voted for ${side}`);
        }
      } else {
        client.say(target, `${context.username} you already voted for ${side}`);
      }
    }
  }

  if (commandName === '!deposit') {
    // think about doing fixed deposites or maybe let the user choose the amount?
    // TODO: maybe somehow create a qr code to display in twitch? is that possible? HELP
    run_shell("lnm deposit 1000", function(json){
        data = JSON.parse(json);
        client.say(target, `you payment request for 1000 sats has been created: ${data.paymentRequest}`);
    });
  }

  if (commandName === '!running_positions') {
    run_shell("lnm positions", function(json){
      print_positions(target, client, "running", json);
    });
    console.log(`* Executed ${commandName} command`);
  }

  if (commandName === '!open_positions') {
    run_shell("lnm positions open", function(json){
      print_positions(target, client, "open", json);
      console.log(`* Executed ${commandName} command`);
    });
  }

  if (commandName === '!balance') {
    run_shell("lnm balance", function(balance){
      client.say(target, `Our balance is ${balance} satoshis.`);
      console.log(`* Executed ${commandName} command`);
    });
  }

  // only channel owner can run those commands
  // make very sure only privleges can do that maybe not even mods
  // dangerous :D
  // TODO: cleanup no duplicate code :)
  if  (target === "#dni256") {
    if (commandName === '!close') {
      let args = parseArgs(commandName);
      if (args) {
        let pid = args[1];
        run_shell("lnm close "+pid, function(balance){
          client.say(target, `${context.username} closed order`);
        });
      }
    }
    if (commandName === '!cancel') {
      let args = parseArgs(commandName);
      if (args) {
        let pid = args[1];
        run_shell("lnm cancel "+pid, function(balance){
          client.say(target, `${context.username} canceled order`);
        });
      }
    }

    if (commandName.indexOf('!buy_market') === 0) {
      market_order_validation(target, client, commandName, function(qty, leverage) {
        run_shell(`lnm buy_market ${qty} ${leverage}`, function(res){
          client.say(target, `You bought the market! :)`);
          console.log(`* Executed ${commandName} command`);
        });
      });
    }

    if (commandName.indexOf('!sell_market') === 0) {
      market_order_validation(target, client, commandName, function(qty, leverage) {
        run_shell(`lnm sell_market ${qty} ${leverage}`, function(res){
          client.say(target, `You sold the market! :)`);
          console.log(`* Executed ${commandName} command`);
        });
      });
    }

    if (commandName.indexOf('!sell_limit') === 0) {
      limit_order_validation(target, client, commandName, function(qty, leverage, price) {
        run_shell(`lnm sell_limit ${qty} ${leverage} ${price}`, function(res){
          client.say(target, `created a sell limit order! :)`);
          console.log(`* Executed ${commandName} command`);
        });
      });
    }

    if (commandName.indexOf('!buy_limit') === 0) {
      limit_order_validation(target, client, commandName, function(qty, leverage, price) {
        run_shell(`lnm buy_limit ${qty} ${leverage} ${price}`, function(res){
          client.say(target, `created a buy limit order! :)`);
          console.log(`* Executed ${commandName} command`);
        });
      });
    }
  }

  // only privileges users can runs those commands
  if  (target === "#dni256" || context.mod === true) {

    if (commandName === '!cancel_all') {
      run_shell("lnm cancel_all", function(balance){
        client.say(target, `${context.username} canceled all orders`);
      });
    }
    if (commandName === '!close_all') {
      run_shell("lnm close_all", function(balance){
        client.say(target, `${context.username} closed all orders`);
      });
    }
    if (commandName === '!execute_votes') {
      // maybe a fixed amount and leverage if voting has ended so mod couldnt exploit
      // make_trade(votes);
      votes.long = 0;
      votes.short = 0;
      votes.usernames = [];
      client.say(target, `${context.username} executed votes`);
    }
    if (commandName === '!reset_votes') {
      votes.long = 0;
      votes.short = 0;
      votes.usernames = [];
      client.say(target, `${context.username} reseted votes`);
    }
  }
}


// TODO: think hard about the security of it :)
// i guess when not passing arguments from chat message into it, its safe
function run_shell(cmd, done) {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    done(stdout);
  });
}

function parseArgs(cmd) {
  let split = cmd.split(" ");
  if (split.length > 1) {
    return split;
  }
  // return false if there is no args
  return false;
}

function print_positions(target, client, type, json) {
  positions = JSON.parse(json);
  if (positions.length > 0) {
    client.say(target, `${type} positions: (pid, created_at, PL, side, type, price, qty, leverage, margin, liquidation, stoploss, takeprofit)`);
    positions.forEach(function(p){
      created_at = new Date(p.creation_ts).toISOString();
      client.say(target, `Position: ${p.pid}, ${created_at}, ${p.pl}, ${p.side}, ${p.type}, ${p.price}, ${p.quantity}, ${p.leverage}, ${p.margin}, ${p.liquidation}, ${p.stoploss}, ${p.takeprofit}.`);
    });
  } else {
    client.say(target, `No ${type} positions.`);
  }
}

// args very DANGEROUS to pass into run_shell
//  TODO: maybe think about some manual activation of some kind from the mods or me before we run the command
//  IDEA: DONE maybe typecheck all the arguments because everything has to be float/integer
//  DONE: ??? malicious requests should be safer when checking for int? DONE
//  also ban people if they try to use it maliciously
function market_order_validation(target, client, commandName, callback) {
    args = commandName.split(" ");
    qty = parseInt(args[1]);
    leverage = parseInt(args[2]);
    if (typeof qty === "number" && qty > 0 && typeof leverage === "number" && leverage > 0) {
      callback(qty, leverage);
    } else {
      client.say(target, `input validation failed`);
    }
}

function limit_order_validation(target, client, commandName, callback) {
    args = commandName.split(" ");
    qty = parseInt(args[1]);
    leverage = parseInt(args[2]);
    price = parseInt(args[3]);
    if (typeof qty === "number" && qty > 0
      && typeof leverage === "number" && leverage > 0
      && typeof price === "number" && price > 0) {
      callback(qty, leverage, price);
    } else {
      client.say(target, `input validation failed`);
    }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
