import { ethers } from 'ethers';
import 'dotenv/config';

import { WALLET_DATA } from './constants.js';

const delay = () => {
  const ms = Math.floor(Math.random() * (4000 - 2000 + 1) + 2000);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getCommonRequst = (args) => {
  const payload = { ...args };

  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://dashboard.layeredge.io',
    },
    body: JSON.stringify(payload),
  };
};

const signMessage = async (privateKey) => {
  try {
    const wallet = new ethers.Wallet(privateKey);

    const timeStamp = Date.now();
    const claimMessage = `I am claiming my daily node point for ${wallet.address} at ${timeStamp}`;
    const nodeMessage = `Node activation request for ${wallet.address} at ${timeStamp}`;

    const signedClaimMessage = await wallet.signMessage(claimMessage);
    await delay();
    const signedNodeMessage = await wallet.signMessage(nodeMessage);
    await delay();

    const walletAddress = await registerWallet(wallet.address);

    if (walletAddress) {
      await claimPoints(walletAddress, signedClaimMessage, timeStamp);
      await delay();
      await startNode(signedNodeMessage, timeStamp, walletAddress);
      await delay();
    }
  } catch (error) {
    console.error('Ошибка при генерации сообщения:', error);
  }
};

const registerWallet = async (walletAddress) => {
  const apiUrl = `https://referralapi.layeredge.io/api/referral/register-wallet/${process.env.REF_CODE}`;

  try {
    const response = await fetch(apiUrl, getCommonRequst({ walletAddress }));

    if (response.status === 200) {
      console.log(`Адрес ${walletAddress} успешно зарегестрирован`);
      return walletAddress;
    }
    if (response.status === 409) {
      console.error(`Адрес ${walletAddress} уже зарегестрирован`);
      return walletAddress;
    }
  } catch (error) {
    console.error('Ошибка при отправке запроса:', error);
    return '';
  }
};

const startNode = async (sign, timestamp, walletAddress) => {
  const apiUrl = `https://referralapi.layeredge.io/api/light-node/node-action/${walletAddress}/start`;

  try {
    const response = await fetch(apiUrl, getCommonRequst({ sign, timestamp }));

    if (response.status === 200) {
      console.log(`Успешно запущена нода на адресе ${walletAddress}`);
      return walletAddress;
    }
    if (response.status === 405) {
      console.error(`На адресе ${walletAddress} нода уже запущена`);
      return walletAddress;
    }
  } catch (error) {
    console.error('Ошибка при отправке запроса:', error);
    return '';
  }
};

const claimPoints = async (walletAddress, sign, timestamp) => {
  const apiUrl = 'https://referralapi.layeredge.io/api/light-node/claim-node-points';

  try {
    const response = await fetch(apiUrl, getCommonRequst({ walletAddress, sign, timestamp }));

    if (response.status === 200) {
      console.log(`Успешный claim для ${walletAddress}`, result);
    }
    if (response.status === 405) {
      console.error(`Для кошелька ${walletAddress} уже выполнен claim. Попробуйте снова позже`);
    }
  } catch (error) {
    console.error('Ошибка при отправке запроса:', error);
  }
};

const init = () => {
  WALLET_DATA.forEach(async (walletData) => await signMessage(walletData.private_key));
};

init();
