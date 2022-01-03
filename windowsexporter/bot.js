const Discord = require(`discord.js`);
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const data = require('./data.json');

if(!data.nodee_address || !data.token){
    console.error("lease add token and Node Exporter url to data.json");
    process.exit(1);
}

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
client.login(data.token).then(() => {
    console.log("Bot launched. (WindowsExporter)");
    updateStatusRAM();
    setInterval(() => {
        updateStatusRAM();
        setTimeout(() => {
            updateStatusCPU();
        }, 4000);
    }, 10000);
});


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

let nodee;
const updateStatusCPU = async() => {
    const res = await fetch(data.nodee_address);
    const nodedata = await res.text();

    nodee = nodedata.split('\n');
    let cpuUsage, cpuTotal, cpuUsage1 = 0, cpuTotal1 = 0, cpuUsage2 = 0, cpuTotal2 = 0; // CPU
    const cpuRegex = /^windows_cpu_time_total{core="(0,\d)",mode="(dpc|idle|interrupt|privileged|user)"} (\d+([.]\d*)?(e[+-]?\d+)?)/i;
    nodee.forEach(element => {
        if(element.match(cpuRegex)){
            if(element.match(cpuRegex)[2] != "idle")cpuUsage1 += parseFloat(element.match(cpuRegex)[3]);
            cpuTotal1 += parseFloat(element.match(cpuRegex)[3]);
        }
    });

    setTimeout(async() => {
        const res2 = await fetch(data.nodee_address);
        const nodedata2 = await res2.text();

        let nodee2 = nodedata2.split('\n');
        nodee2.forEach(element => {
            if(element.match(cpuRegex)){
                if(element.match(cpuRegex)[2] != "idle")cpuUsage2 += parseFloat(element.match(cpuRegex)[3]);
                cpuTotal2 += parseFloat(element.match(cpuRegex)[3]);
            }
        });
        cpuUsage = cpuUsage2 - cpuUsage1;
        cpuTotal = cpuTotal2 - cpuTotal1;

        const cpuPercent = (cpuUsage / cpuTotal) * 100;

        client.user.setPresence({activities: [{name: `CPU: ${Math.round(cpuPercent)}%`, type: "WATCHING"}], status: 'online'});
    }, 1000);
}

const updateStatusRAM = async() => {
    const res = await fetch(data.nodee_address);
    const nodedata = await res.text();

    nodee = nodedata.split('\n');
    let memTotal, memFree; // RAM
    nodee.forEach(element => {
        if(element.startsWith("windows_os_virtual_memory_bytes")) memTotal = +(element.replaceAll("windows_os_virtual_memory_bytes ", "")); else
        if(element.startsWith("windows_os_physical_memory_free_bytes" )) memFree  = +(element.replaceAll("windows_os_physical_memory_free_bytes " , ""));
    });

    const memoryTotal = memTotal;
    const memoryFree = memFree;
    const memoryUsed = memoryTotal - memoryFree;
    const memoryPercent = Math.floor((memoryUsed / memoryTotal) * 100);

    const memoryString = `${memoryPercent}% (${((memoryUsed / 1048576) / 1024).toFixed(2)}GB/${((memoryTotal / 1048576) / 1024).toFixed(2)}GB)`;
    client.user.setPresence({activities: [{name: `RAM: ${memoryString}`, type: "WATCHING"}], status: 'online'});
}