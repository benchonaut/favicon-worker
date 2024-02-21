import { Hono } from "https://deno.land/x/hono@v3.4.1/mod.ts";
import { HTMLRewriter } from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts'

const app = new Hono();
const kv = await Deno.openKv();
// Get a favicon by url
app.get("/", async (c) => {
  return c.text( "please use e.g. /favicon/yourdomain.com" )
}
app.get("/", async (c) => {
  return c.redirect("/")
}
app.get("/favicon/*", async (c) => {
  const svgFavicon = 'data:image/svg+xml,'

  const defaultIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4a5568">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>`
  //  //const title = c.req.param("title");
//  //const result = await kv.get(["books", title]);
const init = {
  headers: {
    'content-type': 'text/html;charset=UTF-8',
  },
  redirect: 'follow',
}

 //let requestURL = new URL(c.req.url)
 //const url = requestURL.searchParams.get('url')
  //const url = requestURL.searchParams.get('url')
//const url = c.req.param('url').replace('/favicon/','')
let origURL = new URL(c.req.url)
const requestURL=origURL
const url = origURL.pathname.replace('/favicon/','')+origURL.search
//const inurl = new URL(c.req.url.startsWith('https') ? c.req.url : 'https://' + url)
//const tmpurl = new URL(inurl)
//const requrl=tmpurl.pathname.replace(/^\/domain\//,"")+tmpurl.search
const requrl=url
let realurl=""
  if(requrl.startsWith("https:")||requrl.startsWith("http:")) {
    realurl=requrl
  } else {
    realurl="http://"+requrl
  }
  //return c.json({url: realurl, tmp: tmpurl});

//const targetURL = new URL(url.startsWith('https') ? url : 'https://' + url)
const targetURL = new URL(realurl)
const urldomain=targetURL.hostname
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
    icon = await fetch(`https://icons.duckduckgo.com/ip2/${url}`)
    let tmpct={}
    tmpct=icon.headers.get('content-type')
    if(!(icon.status>199 && icon.status >205) || tmpct.includes('application') || tmpct.includes('text') ) {
      icon = await fetch(`http://favicon.yandex.net/favicon/${urldomain}`)
      tmpct=icon.headers.get('content-type')
    } 
    if(!(icon.status>199 && icon.status >205) || tmpct.includes('application') || tmpct.includes('text') ) {
      icon = await fetch(`https://www.google.com/s2/favicons?domain=${url}`)
    } 

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
