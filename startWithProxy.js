import { ethers } from 'ethers';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import 'dotenv/config';

import { MAIN_WALLETS, PROXY } from './constants.js';

const findFirstDigit = (str) => {
  const match = str.match(/\d/);
  return match ? match[0] : null;
};

const delay = () => {
  const ms = Math.floor(Math.random() * (4000 - 2000 + 1) + 2000);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getCommonRequst = (args, proxy, userAgent) => {
  return {
    agent: proxy,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-agent': userAgent,
      Origin: 'https://dashboard.layeredge.io',
    },
    body: JSON.stringify(args),
  };
};

const signMessage = async (privateKey, proxyData) => {
  try {
    const { proxyName, userAgent } = proxyData;

    const wallet = new ethers.Wallet(privateKey);

    const timestamp = Date.now();
    const claimMessage = `I am claiming my daily node point for ${wallet.address} at ${timestamp}`;
    const nodeMessage = `Node activation request for ${wallet.address} at ${timestamp}`;

    const signedClaimMessage = await wallet.signMessage(claimMessage);
    await delay();
    const signedNodeMessage = await wallet.signMessage(nodeMessage);
    await delay();

    const proxyUrl = `http://${proxyName}`;

    const proxyAgent = new HttpsProxyAgent(proxyUrl);

    const walletAddress = await registerWallet(
      getCommonRequst({ walletAddress: wallet.address }, proxyAgent, userAgent),
      wallet.address,
    );

    if (walletAddress) {
      await claimPoints(
        getCommonRequst({ walletAddress, sign: signedClaimMessage, timestamp }, proxyAgent, userAgent),
        walletAddress,
      );
      await delay();
      await startNode(getCommonRequst({ sign: signedNodeMessage, timestamp }, proxyAgent, userAgent), walletAddress);
      await delay();
    }
  } catch (error) {
    console.error('Ошибка при генерации сообщения:', error);
  }
};

const registerWallet = async (commonRequest, walletAddress) => {
  const apiUrl = `https://referralapi.layeredge.io/api/referral/register-wallet/${process.env.REF_CODE}`;

  try {
    const response = await fetch(apiUrl, commonRequest);

    if (response.status === 200) {
      console.log(`Адрес ${walletAddress} успешно зарегестрирован`);
      return walletAddress;
    }
    if (response.status === 409) {
      console.error(`Адрес ${walletAddress} уже зарегестрирован`);
      return walletAddress;
    }
  } catch (error) {
    console.error('Ошибка при регистрации кошелька:', error);
    return '';
  }
};

const startNode = async (commonRequest, walletAddress) => {
  const apiUrl = `https://referralapi.layeredge.io/api/light-node/node-action/${walletAddress}/start`;

  try {
    const response = await fetch(apiUrl, commonRequest);

    if (response.status === 200) {
      console.log(`Успешно запущена нода на адресе ${walletAddress}`);
      return walletAddress;
    }
    if (response.status === 405) {
      console.error(`На адресе ${walletAddress} нода уже запущена`);
      return walletAddress;
    }
  } catch (error) {
    console.error('Ошибка при запуски ноды:', error);
    return '';
  }
};

const claimPoints = async (commonRequest, walletAddress) => {
  const apiUrl = 'https://referralapi.layeredge.io/api/light-node/claim-node-points';

  try {
    const response = await fetch(apiUrl, commonRequest);

    if (response.status === 200) {
      console.log(`Успешный claim для ${walletAddress}`);
    }
    if (response.status === 405) {
      console.error(`Для кошелька ${walletAddress} уже выполнен claim. Попробуйте снова позже`);
    }
  } catch (error) {
    console.error('Ошибка при клэйми:', error);
  }
};

const init = () => {
  MAIN_WALLETS.forEach(async (walletData) => {
    await signMessage(walletData.private_key, PROXY[findFirstDigit(walletData.private_key)]);
    await delay();
  });
};

init();
