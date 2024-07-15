const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const cheerio = require("cheerio");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { time } = require("console");
const path = require("path");

// time.sleep 함수
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 스타벅스 매장이름, 주소 추출 함수
function getStoreBasicInfo(arr) {
  return arr.map(item => {
    const $ = cheerio.load(item);
    const title = $('strong').text().trim();
    const address = $('p').text().trim();
    return { title, address };
  });
}

// 현재 날짜를 YYYY-MM-DD 형식으로 반환하는 함수
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// apis
const getStarBucksBasicInfoFromNaver = async () => {
  const browser = await puppeteer.launch({
    headless: true,  // headless 모드로 실행
    executablePath: '/usr/bin/google-chrome', // Chrome의 경로 지정
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://www.starbucks.co.kr", []);

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 페이지 로드 대기
  await page.goto("https://www.starbucks.co.kr/store/store_map.do", {
    waitUntil: 'networkidle0',
    timeout: 0
  });

  await page.waitForSelector('.quickSearchResultBox', { visible: true });

  await page.$eval('.find_store_cont_header > .btn_opt_chk > a', el => el.click());

  await page.waitForSelector('.opt_select_pop', { visible: true });
  await page.waitForSelector('.opt_select_dl1', { visible: true });

  await page.$eval('.opt_select_dl1 .right #type2', el => el.click());

  await sleep(5000);

  await page.waitForSelector('.opt_sel_btns', { visible: true });
  await page.$eval('.opt_sel_btns .li2 > a', el => el.click());

  await sleep(5000);

  await page.waitForSelector('#mCSB_1_container', { visible: true });

  await sleep(5000);

  const liArray = await page.$$eval('#mCSB_1_container ul li', elements => elements.map(el => el.innerHTML));

  const storeBasicInfo = getStoreBasicInfo(liArray);
  
  const date = getCurrentDate();
  const fileName = `starbucks/starbucks_${date}.json`;

  fs.writeFileSync(fileName, JSON.stringify(storeBasicInfo, null, 2), 'utf8');
  console.log(`Successfully wrote to ${fileName}`);

  await browser.close();  // 브라우저를 닫습니다
};

// 비동기 함수 호출 및 에러 처리
getStarBucksBasicInfoFromNaver().catch(error => {
  console.error("Error fetching data:", error);
  process.exit(1);  // 에러 발생 시 프로세스 종료
}).finally(() => {
  process.exit(0);  // 작업이 완료되면 프로세스를 정상 종료
});
