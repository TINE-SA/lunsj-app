#!/usr/bin/env bash
#prereq: azure-cli client installed (az)
az login
az account set --subscription <subscription_name>
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings STORAGE_NAME=<storage_account_name>
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings STORAGE_KEY=<storage_account_access_key>
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings PARTITION_KEY_MENU=Menu
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings PARTITION_KEY_ORDER=Order
az appservice web config appsettings update --name <appservice_name> --resource-group <resourcegroup_name> --settings TABLE_NAME=lunsj
az appservice web config appsettings show --verbose --name <appservice_name> --resource-group <resourcegroup_name>
