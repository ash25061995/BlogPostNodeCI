const puppeteer = require('puppeteer');
const sessionFactory = require('../Factories/sessionFactory');
const userFactory = require('../Factories/userFactory');

class CustomPage {
    static async build() {
        const browser = await puppeteer.launch({
            headless: true,
            args:['--no-sandbox']
        })
        const page = await browser.newPage();
        const customPage = new CustomPage(page);
        return new Proxy(customPage, {
            get: function (target, property) {
                return target[property] || browser[property] || page[property]
            }
        })

    }

    constructor(page) {
        this.page = page;
    }

    async login() {
        const user = await userFactory();

        const { session, sig } = sessionFactory(user);

        await this.page.setCookie({ name: 'session', value: session })//setting cookie to fake the session for chromium instance in order to login
        await this.page.setCookie({ name: 'session.sig', value: sig })
        await this.page.goto('http://localhost:3000/blogs')
        await this.page.waitFor('a[href="/auth/logout"]',{timeout:70000})
    }
    async getContentsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }

    async get(path){
        const result = await this.page.evaluate((path) => {
            return fetch(path, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(res => res.json())
        },path)

        return result;
    }

    async post(path,data){
        const result = await this.page.evaluate((path,data) => {
            return fetch(path, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(res => res.json())
        },path,data)

        return result;
    }

    execRequests(actions){

      return Promise.all(
          actions.map(({method,path,data})=>{
           return this[method](path,data);
        }))
    }
}

module.exports = CustomPage;