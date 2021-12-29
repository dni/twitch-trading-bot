# twitch-trading-bot
Twitch Trading Bot for lnmarkets.com with interactive voting. Engage your viewer and trade as a community

## TODO
* add takeprofit and add margin to orders
* do some kind of !profit_of_session command
* somehow create QR code to make depositing easier
* format the the output of print_positions

# commands

```
!help
```
display a link to this README

```
!vote
```
displays current votes of users
```
!vote (long | short)
```
users can vote long or short and after a defined time by the mods, they can !execute_orders on behalf of the user votes

```
!deposit
```
creates an payment request over 1000 sats and prints the address
```
!balance
```
prints current wallet balance in satoshis
```
!open_positions
!running_positions
```
prints current orders


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
