const Discord = require(`discord.js`);
const fs = require('fs');

let data;
try {
    data = JSON.parse(fs.readFileSync(`${__dirname}\\data.json`));
    if(data.token == null || data.token == "") {
        console.error("Please add token to data.json");
        process.exit(1);
    }
}
catch(e){
    data = { token: "", nodee_address: "" };
    fs.writeFileSync(`${__dirname}\\data.json`, JSON.stringify(data));
    console.error("Please add token to data.json");
    process.exit(1);
}

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
client.login(data.token);


client.on('messageCreate', message => {
    const text = message.content;
    if(text == ".ping"){
        message.channel.send("Pinging...").then(msg => {
            var ping = msg.createdTimestamp - message.createdTimestamp;
            var embed = new Discord.MessageEmbed().setAuthor(`Ping: ${ping} ms`).setColor("#00CAFF");
            msg.edit({content: "Pong!", embeds: [embed]});
        });
    }
});
