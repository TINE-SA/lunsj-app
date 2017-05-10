# lunsj-app
Lunsj-applikasjon hos Tine
Dette er en fork av Vegard Gamnes opprinnelige lunsj-app (https://github.com/vegardga/lunsj-app), tilpasset Azure, og videreutviklet av TINE-SA teamet.

#Installasjon og kjøring lokalt
* Klone repo (git clone git@github.com:TINE-SA/lunsj-app.git)
* Kopier ```config_template.json``` til ny fil ```azure_config.json``` og oppdater med korrekte Azure Storage parametere  
* NB: azure_config.json skal alltid være i .gitignore for at storage account secrets osv. ikke skal pushes til Git! 
* ```npm install && node lunsj.js```
* http://localhost:5000/tine-lunsj

#Installasjon og kjøring i Azure.
* AppService skal være satt opp mot riktig Git repo, og med env variabler som peker mot riktig storageaccount osv.
* Hvis ikke kan dette gjøres med Azure cli eller i dashboard, se også: https://docs.microsoft.com/en-us/azure/app-service-web/app-service-web-get-started-nodejs
    * Det som evt. trengs er en App Service som settes opp til å peke mot master branch i https://github.com/TINE-SA/lunsj-app
    * En Storage Account (standard) i samme resource group som AppService du satte opp
    * Sette opp env variable i AppServicen med storage account navn, access key og de andre parameterene fra config_template.json (se azure_setup.sh)
* Push av endringer til Git vil trigge automatisk oppdatering av app i Azure og restart mv.

