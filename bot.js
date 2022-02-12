import { keys } from './keys.js';
import { config } from './config.js';
import { log, sleep } from './utils.js';
import { Client, Intents, MessageEmbed, MessageAttachment } from 'discord.js';
import fs from 'fs';
const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

import Web3 from 'web3';
import axios from 'axios';
var web3_http = new Web3(`${config.RPC_HTTP}/${keys.INFURA_KEY}`);

const LOCAL_DATA = 1;

async function getImage(src, tokenId) {
  console.log(`${src}/${tokenId}`);
  for (let retries = 0;; retries++) {
    try {
      const ret = await axios.get(`${src}/${tokenId}`).then( u => {
        if (typeof(u.data.image) === 'undefined') {
          return -1;
        } else {
          return axios.get(`${config.IPFS}/${u.data.image.split('ipfs://')[1]}`, {
            responseType: 'arraybuffer'
          }).then(response => Buffer.from(response.data, 'binary'));
        }
      });
      if (ret === -1) {
        if (retries < config.MAX_RETRIES) {
          await sleep(10000);
          log(`${tokenId}: Image not ready. Retrying...`)
          continue;
        } else {
          log(`${tokenId} issue!`)
          return -1;
        }
      } else {
        return ret;
      }
    } catch (e) {
      if (retries < config.MAX_RETRIES) {
        await sleep(10000);
        log(`${tokenId}: 404. Retrying...`)
        continue;
      } else {
        log(`${tokenId} issue!`)
        return -1;
      }
    }
  }
}

async function getImageLocal(tokenId) {
  return fs.readFileSync(`./data/images/flyfrog${tokenId}.png`)
}

async function getContract(contractAddress, http = 0) {
  const abi_url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${keys.ETHERSCAN_KEY}`;
  const abi = await axios.get(abi_url).then((result) => {return JSON.parse(result.data.result)});
  return (http === 0) ? new web3_ws.eth.Contract(abi, contractAddress) : new web3_http.eth.Contract(abi, contractAddress);
}

discord.on('messageCreate', async m => {
  if (!m.author.bot) {
    if (m.content.indexOf('!fff') === 0) {
      const id = m.content.split('!fff')[1].trim();
      if (id >= 0 && id <= 9999) {
        m.channel.sendTyping();
        const png = (LOCAL_DATA === 1) ? await getImageLocal(id) : await getImage(`${config.IPFS}/QmRdNB3Q6Q5gVWnduBmxNZb4p9zKFmM3Qx3tohBb8B2KRK`, id);
        await sendMessage(m.channelId, 'FlyFrog', id, png, config.MARKET);
      } else {
        await discord.channels.cache.get(m.channelId).send('tokenId out of bounds! must be 0-9999!');
      }
    }
  }
});


const sendMessage = async (channel, name, tokenId, png, marketURL) => {
  const attachmentName = `${name}-${tokenId}.png`;
  const attachment = new MessageAttachment(png, attachmentName);
  const message = new MessageEmbed()
    .setTitle(`${name} ${tokenId}`)
    .setURL(`${marketURL}/${config.CONTRACT}/${tokenId}`)
    .setTimestamp();
  (png !== -1) ? message.setImage(`attachment://${attachmentName}`) : null;
  if (png !== -1) {
    await discord.channels.cache.get(channel).send({ embeds: [message], files:[attachment] });
  } else {
    await discord.channels.cache.get(channel).send({ embeds: [message]});
  }
}

discord.once('ready', async c => {
  log(`Ready! Logged in as ${c.user.tag}`);
});

discord.login(keys.DISCORD_KEY);