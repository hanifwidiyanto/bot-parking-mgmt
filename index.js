import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import {
    executablePath
} from 'puppeteer'
puppeteer.use(StealthPlugin())
import chalk from 'chalk';
import moment from 'moment';
import UserAgent from 'user-agents';
import cron from 'node-cron'
import fs from 'fs';
const userAgent = new UserAgent();

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}
const time = () => {
    return chalk.green(moment().format('LTS'))
}

const getDataBike = async (account) => {
    const { email, password } = account

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: false,
        executablePath: executablePath()
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
    });

    await page.setUserAgent(userAgent.toString())

    console.log(`[${time()}] mencoba login...`)

    await page.goto('https://parking.facilitymgmt.online/auth');

    console.log(`[${time()}] mengisi email...`)

    const inputText = 'input[id=username]';
    await page.waitForSelector(inputText);

    await page.type(inputText, email);
    console.log(`[${time()}] mengisi password...`)
    const inputPass = 'input[id=password]';
    await page.waitForSelector(inputPass);

    await page.type(inputPass, password);

    await page.keyboard.press('Enter');
    await delay(3000);

    const url = page.url();
    if (url == 'https://parking.facilitymgmt.online/home') {
        console.log('login berhasil')
    }

    const getNoVehicle = await page.$x('/html/body/div[3]/div/div[6]/div/div/table/tbody/tr[2]/td[2]');
    const noVehicle = await page.evaluate(el => el.textContent, getNoVehicle[0]);

    await browser.close()

    if (noVehicle.includes(',')) return noVehicle.split(' , ')
    return [noVehicle]
}

const getDataUser = () => {
    return new Promise((resolve, reject) => {
        const fileName = 'parking-user.json';

        fs.readFile(fileName, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                jsonData.forEach(async (item, index) => {
                    if (item.listBike.length == 0) {
                        console.log(`data ${item.name} kosong, mengisi data`)
                        const dataBike = await getDataBike(item.account)
                        let dataTemp = jsonData
                        dataTemp[index].listBike = dataBike

                        fs.writeFile(fileName, JSON.stringify(dataTemp, null, 2), (err) => {
                            if (err) {
                                console.error(err);
                                return
                            }
                            console.log('Data JSON telah diubah dan ditulis kembali ke file.');
                            resolve(jsonData)
                        });
                    } else {
                        resolve(jsonData)
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    });
};

const getParking = async (account, bikeChoosed) => {
    const { email, password } = account

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: false,
        executablePath: executablePath()
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
    });

    await page.setUserAgent(userAgent.toString())

    console.log(`[${time()}] mencoba login...`)

    await page.goto('https://parking.facilitymgmt.online/auth');

    console.log(`[${time()}] mengisi email...`)

    const inputText = 'input[id=username]';
    await page.waitForSelector(inputText);

    await page.type(inputText, email);
    console.log(`[${time()}] mengisi password...`)
    const inputPass = 'input[id=password]';
    await page.waitForSelector(inputPass);

    await page.type(inputPass, password);

    await page.keyboard.press('Enter');
    await delay(3000);

    const url = page.url();
    if (url == 'https://parking.facilitymgmt.online/home') {
        console.log('login berhasil')
    }
    await page.click('body > div.container-sm > div > div:nth-child(2)');
    console.log(bikeChoosed)
    console.log(``)
    const plat = await page.waitForSelector(`#pilihan${2 + bikeChoosed}`);
    console.log('plat' + plat)
    await page.evaluate(e => e.click(), plat)
    console.log('suces klik')
    const button = await page.waitForSelector(`#reservationBtn`)

    await page.evaluate(e => e.click(), button)

    await browser.close()
    console.log('close')
}

const runAtMidnight = async () => {
    try {
        const data = await getDataUser();
        data.forEach((item, index) => {
            getParking(item.account, parseInt(item.chooseBikeToday));
        });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
};

cron.schedule('1 0 * * *', () => {
    console.log(`[${time()}] Menjalankan kode pada jam 00:01`);
    runAtMidnight();
});

/*
== alur by bot wa ==
1. bikin bot wa
2. nge cron tiap jam 19.30 buat nanya mau dibookingin ga
3. kalo iya ubah jadi true
4. terus check motor nya, jika motornya lebih dari 1 chat orangnya ini mau yg no 1 apa no 2
5. kalo udah ok masukin ke chooseBikeToday
6. nah botnya bakal jalan 1-1 buat nge bookingin akunnya


== alur pendaftaran ==
1. bot menerima pesan
2. 
*/
