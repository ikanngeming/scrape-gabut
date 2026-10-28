const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();

const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  })
);

class TempMail {
    async new() {
        try {
            const c = await client.get("https://temp-mail.io/id")
            const d = await client.post("https://api.internal.temp-mail.io/api/v3/email/new",{
                headers: {
                    "Cookie": c.headers['set-cookie'],
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0"
                }
            })

            return d.data
        } catch (error) {
            console.log(error)
        }
    }

    async message(email) {
        try {
            const c = await client.get("https://temp-mail.io/id")
            const d = await client.get(`https://api.internal.temp-mail.io/api/v3/email/${email}/messages`,{
                headers: {
                    "Cookie": c.headers['set-cookie'],
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0"
                }
            })

            return d.data
        } catch (error) {
            console.log(error)
        }
    }
}

(async () => {
    const t = new TempMail()
    const r = await t.message("oxlsc4j0@ruutukf.com")

    console.log(r)
})()
