#!/usr/bin/env bash
#prereq: azure-cli client installed (az)
az login
az account set --subscription <subscription_name>
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings STORAGE_NAME=<storage_account_name>
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings STORAGE_KEY=<storage_account_access_key>
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings PARTITION_KEY_MENU=Menu
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings PARTITION_KEY_ORDER=Order
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings PARTITION_KEY_DRIVER=Driver
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings TABLE_NAME=lunsj
az appservice web config appsettings show --verbose --name <appservice_name> --resource-group <resourcegroup_name>

#If using deployment slots you should use the following syntax for setting the slot dependant variables instead:
# az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --slot <slot_name> --slot-settings TABLE_NAME=<deployment_slots_table_name>
#Depending on the slot setup you may want to use another storage account, or if in the same account, another table name etc.
#There is no way to swap to/from regular and slot setting, to do that you need to delete the setting and recreate it with --settings/--slot-settings:
# az appservice web config appsettings delete --name lunsj-app --resource-group trmwest --setting-names test
