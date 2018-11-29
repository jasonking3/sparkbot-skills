# sparkbot-skills
This is a collection of example skills for the botkit framework.  They were tested  with
the Cisco Spark version of the framework (howdyai/botkit-starter-ciscospark).  I developed
these primarily as a technology demonstrator for ChatOps.  To install,
simply drop the .js files into the "skills" folder and start the bot.

You must supply the following environment variables in order for these skills to work:

- dnsimple_user - Your dnsimple username
- dnsimple_token - Your v1 API token for dnsimple
- fmc_user - the FMC username
- fmc_password - the FMC password 
- fmc_host - the FMC host
- tower_user - the Ansible Tower username
- tower_password - the Ansible Tower password
- tower_host - the Ansible Tower host
