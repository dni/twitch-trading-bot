# twitch-trading-bot
Twitch Trading Bot for lnmarkets.com with interactive voting. Engage your viewer and trade as a community

## TODO
* do the !help command and explain everything
* add takeprofit and add margin to orders
* do some kind of !profit_of_session command

# commands

```
!help

!vote
!vote (long | short)

!deposit
!balance
!open_positions
!running_positions

```
# owner commands
```
!close $pid
!cancel $pid
!sell_market $qty $leverage
!buy_market $qty $leverage
!sell_limit $qty $leverage $price
!buy_limit $qty $leverage $price
```

# mod commands
```
!execute_votes
!reset_votes
!close_all
!cancel_all
```
