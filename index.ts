import { Hono } from "https://deno.land/x/hono@v3.4.1/mod.ts";
import { HTMLRewriter } from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts'

const app = new Hono();
const kv = await Deno.openKv();

// Get a favicon by url
app.get("/domain/*", async (c) => {

  //  //const title = c.req.param("title");
//  //const result = await kv.get(["books", title]);
const init = {
  headers: {
    'content-type': 'text/html;charset=UTF-8',
  },
  redirect: 'follow',
}
 //let requestURL = new URL(c.request.url)
 //const url = requestURL.searchParams.get('url')
  //const url = requestURL.searchParams.get('url')
const url = c.req.param('url').replace('/domain/','')

//const tmpurl = new URL(url.startsWith('https') ? url : 'https://' + url)

let realurl=""
  if(tmpurl.startsWith("https:")||tmpurl.startsWith("http:")) {
    realurl=url.pathname+url.search
  } else {
    realurl="http://"+url.path+url.search
  }
return c.json({url: realurl});

const targetURL = new URL(url.startsWith('https') ? url : 'https://' + url)
 let favicon = ''
  const response = await fetch(targetURL.origin, init).catch(() => {
    console.log('failed')
  })

  let newResponse = new HTMLRewriter()
    .on('link[rel*="icon"]', {
      async element(element) {
        if (element.getAttribute('rel') === 'mask-icon' || favicon) return
        favicon = element.getAttribute('href')
        if (favicon.startsWith('/')) {
          const prefix = favicon.startsWith('//') ? 'https:' : targetURL.origin
          favicon = prefix + favicon
        } else if (!favicon.startsWith('http')) {
          favicon = targetURL.origin + '/' + favicon
        }
      },
    })
    .transform(response)

  await newResponse.text()

  if (!favicon) {
    const fav = await fetch(targetURL.origin + '/favicon.ico')
    if (fav.status === 200) {
      const resss = new Response(fav.body, { headers: fav.headers })
      resss.headers.set('Cache-Control', 'max-age=86400')

      return resss
    }

    const defaultIcon = new Response(defaultIconSvg, {
      headers: {
        'content-type': 'image/svg+xml',
      },
    })

    defaultIcon.headers.set('Cache-Control', 'max-age=36000')

    return defaultIcon
  }

  const isRaw = requestURL.searchParams.get('raw')

  if (isRaw !== null) {
    const ic = new Response(favicon)
    ic.headers.set('Cache-Control', 'max-age=86400')
    return ic
  }

  let icon = await fetch(favicon)

  if (favicon.includes(svgFavicon)) {
    return new Response(decodeURI(favicon.split(svgFavicon)[1]), {
      headers: {
        'content-type': 'image/svg+xml',
      },
    })
  }

  const ct = icon.headers.get('content-type')

  if (ct.includes('application') || ct.includes('text')) {
    icon = await fetch(`https://www.google.com/s2/favicons?domain=${url}`)
  }

  const iconRes = new Response(icon.body)

  iconRes.headers.set('Cache-Control', 'max-age=86400')
  iconRes.headers.set('Content-Type', icon.headers.get('content-type'))
//
  return iconRes
//
 // let result="none"
  //return c.json(result);
});

Deno.serve(app.fetch);
