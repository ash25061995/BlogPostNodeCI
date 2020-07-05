const Page = require('./helpers/page')

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000')
})

afterEach(async () => {
    await page.close()
})

describe('when logged in', async () => {
    beforeEach(async () => {
        await page.login();
        await page.click('.btn-floating');
    })
    test('show blog creation form', async () => {

        const url = page.url();
        const text = await page.getContentsOf('.title label')
        expect(url.includes('blogs/new')).toEqual(true)
        expect(text).toEqual('Blog Title')
    })
    describe('and using valid inputs', async () => {
        beforeEach(async () => {
            await page.type('.title input', 'My blog')
            await page.type('.content input', 'My content')
            await page.click('form button')
        })

        test('show confirmation page', async () => {
            const confirmationText = await page.getContentsOf('h5')
            expect(confirmationText).toEqual('Please confirm your entries')
        })
        test('after submitting and saving show index page', async () => {
            await page.click('form .green')
            await page.waitFor('.card');
            const content = await page.getContentsOf('.card-title');
            expect(content).toEqual('My blog')
        })
    })
    describe('and using invalid inputs', async () => {
        beforeEach(async () => {
            await page.click('form button');
        })
        test('show error message', async () => {

            const errorTitle = await page.getContentsOf('.title .red-text');
            const errorContent = await page.getContentsOf('.content .red-text');

            expect(errorTitle).toEqual('You must provide a value')
            expect(errorContent).toEqual('You must provide a value')
        })
    })

})

describe('when not logged in', async () => {

    const actions=[{
        method:'get',
        path:'/api/blogs',
    },{
        method:'post',
        path:'/api/blogs',
        data:{ title: 'My title', content: 'My content' }
    }]

    test('blog creation/retrieval related tests',async ()=>{
        const results=await page.execRequests(actions);

        for(let res of results){
            expect(res).toEqual({ error: 'You must log in!' })
        }
    })
})
