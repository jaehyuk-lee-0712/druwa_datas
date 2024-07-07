// lib / module setting
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const axios = require("axios");
const cherrio = require("cheerio");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { time } = require("console");

// app setting
const app = express();

// cors , cookie , token , secret code setting
const secret = "bongpalscookieiswoomai";
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());


// time.sleep 함수
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 스타벅스 매장이름, 주소 추출 함수

function getStoreBasicInfo(arr) {
  return arr.map(item => {
    const $ = cherrio.load(item);
    const storeName = $('strong').text().trim();
    const stroeAdd = $('p').text().trim();
    return {storeName , stroeAdd}
  })
}

// 날짜 함수
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// apis
// 크롤링 테스트
const getStarBucksBasicInfoFromNaver = async () => {
  try {
    const browsr = await puppeteer.launch({
      headless: true,  // headless 모드로 실행
      executablePath: '/usr/bin/google-chrome', // Chrome의 경로 지정
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });


   const context = browsr.defaultBrowserContext();
   await context.overridePermissions("https://www.starbucks.co.kr", []);

   const page = await browsr.newPage();
   await page.setViewport({width : 1920 , height : 1080});


    await page.goto("https://www.starbucks.co.kr/store/store_map.do", {
      waitUntil: 'networkidle0',
      timeout: 0
    });


    await page.waitForSelector('.quickSearchResultBox', { visible: true });
    
    
    await page.$eval('.find_store_cont_header > .btn_opt_chk > a' , el => el.click());

    // opt_select_pop

    
      await page.waitForSelector('.opt_select_pop', { visible: true });

      await page.waitForSelector('.opt_select_dl1' , {visible : true}) 


      await page.$eval('.opt_select_dl1 .right #type2', el => el.click());

      await page.waitForSelector('.opt_sel_btns' , {visible : true}) ;
      
      await page.$eval('.opt_sel_btns .li2 > a' , el=>el.click());

      await page.waitForSelector('#mCSB_1_container' , {visible : true});
      
      await sleep(2000);
      const liArray = await page.$$eval('#mCSB_1_container ul li', elements => elements.map(el => el.innerHTML));

      const stroeBasicInfo = getStoreBasicInfo(liArray);

      const date= getCurrentDate();
      const fileName = `storeInfo-${date}.json`;

    fs.writeFile(fileName, JSON.stringify(stroeBasicInfo, null, 2), 'utf8', (err) => {
      if (err) {
        console.error("Error writing to file", err);
      } else {
        console.log("Successfully wrote to storeInfo.json");
      }
    });

  } catch (error) {
      console.error("Error fetching data:", error);
    process.exit(1); 
  }
};

getStarBucksBasicInfoFromNaver();

// port setting.

app.listen(9000, () => {
  console.log("서버 다음 포트에서 실행 중 :  9000");
});
