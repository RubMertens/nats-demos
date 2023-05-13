#add the top operator (the self signed one)
.\nsc.exe add operator packaging-inc

#create a system account for interal communications
.\nsc.exe add account SYS
.\nsc.exe add user SYSU
#make sure to assign this account as the system account of the operator
.\nsc.exe edit operator --system-account SYS

# add an actual client account
.\nsc.exe add account peanuts
#make sure jetstreams are enabled for the account
#the '-1's mean unlimited!
.\nsc.exe edit account --name peanuts --js-consumer -1  --js-disk-storage -1 --js-streams -1 --js-mem-storage -1

#add some users
.\nsc.exe add user checker
.\nsc.exe add user conveyor
.\nsc.exe add user dashboard

#generate the creds files
.\nsc.exe generate creds --account peanuts --name checker --output-file ./creds/checker.creds
.\nsc.exe generate creds --account peanuts --name conveyor --output-file ./creds/conveyor.creds
.\nsc.exe generate creds --account peanuts --name dashboard --output-file ./creds/dashboard.creds

#generated the config
.\nsc.exe generate config --mem-resolver --config-file .\resolver-config
#⚠ MANUAL add system account to config ⚠
#for example:
# system_account: "AA46UMWMO7MTNJMJ2FJUYBWOAQCPFMX4OCCLCIEUILA6XNCJJGJQTDMG"