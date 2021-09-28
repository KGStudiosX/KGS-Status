const Discord = require(`discord.js`);
const fs = require('fs');
const http = require('http');

let data;
try {
    data = JSON.parse(fs.readFileSync(`data.json`));
    if(data.token == null || data.token == "") {
        if(data.nodee_address == null || data.nodee_address == "") console.error("Please add token and Windows Exporter url to data.json"); else console.error("Please add token to data.json");
        process.exit(1);
    }
    if(data.nodee_address == null || data.nodee_address == ""){
        console.error("Please add Windows Exporter url to data.json");
        process.exit(1);
    }
}
catch(e){
    data = { token: "", nodee_address: "" };
    fs.writeFileSync(`data.json`, JSON.stringify(data));
    console.error("Please add token to data.json");
    process.exit(1);
}

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
client.login(data.token).then(() => {
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
    const request = http.get(data.nodee_address, (response) => {
        let rawdata = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => rawdata += chunk);
        response.on('end', () => {
            try{
                nodee = rawdata.split('\n');
                let cpuUsage, cpuTotal, cpuUsage1 = 0, cpuTotal1 = 0, cpuUsage2 = 0, cpuTotal2 = 0; // CPU
                const cpuRegex = /^windows_cpu_time_total{core="(0,\d)",mode="(dpc|idle|interrupt|privileged|user)"} ([+-]?([0-9]*[.])?[0-9]+)/i;
                nodee.forEach(element => {
                    if(element.match(cpuRegex)){
                        if(element.match(cpuRegex)[2] != "idle")cpuUsage1 += +element.match(cpuRegex)[3];
                        cpuTotal1 += +element.match(cpuRegex)[3];
                    }
                });

                setTimeout(() => {
                    const request2 = http.get(data.nodee_address, (response2) => {
                        let rawdata2 = '';
                        response2.setEncoding('utf8');
                        response2.on('data', (chunk2) => rawdata2 += chunk2);
                        response2.on('end', () => {
                            nodee2 = rawdata2.split('\n');
                            nodee2.forEach(element => {
                                if(element.match(cpuRegex)){
                                    if(element.match(cpuRegex)[2] != "idle")cpuUsage2 += +element.match(cpuRegex)[3];
                                    cpuTotal2 += +element.match(cpuRegex)[3];
                                }
                            });
                            cpuUsage = cpuUsage2 - cpuUsage1;
                            cpuTotal = cpuTotal2 - cpuTotal1;

                            const cpuPercent = (cpuUsage / cpuTotal) * 100;

                            client.user.setActivity({name: `CPU: ${Math.round(cpuPercent)}%`, type: "WATCHING"});
                        });
                    });
                }, 1000);
            } catch (e){
                console.log(e);
            }
        })
    });
}

const updateStatusRAM = async() => {
    const request = http.get(data.nodee_address, (response) => {
        let rawdata = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => rawdata += chunk);
        response.on('end', () => {
            try{
                nodee = rawdata.split('\n');
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
                client.user.setActivity({name: `RAM: ${memoryString}`, type: "WATCHING"});
            } catch (e){
                console.log(e);
            }
        })
    });
}