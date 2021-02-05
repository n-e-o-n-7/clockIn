const Koa = require("koa")
const body = require("koa-body")
const fs = require("fs")
let axios = require('axios');
let http = require('http');
let city = require('./city')
const app = new Koa()
app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`,ctx.request.body);
  });

app.use(
	body({
		jsonLimit: "10mb",
		formLimit: "10mb",
		textLimit: "10mb",
	})
)
let read = () =>{
    return JSON.parse(fs.readFileSync("user.json"));
}
let write = data =>{
    fs.writeFileSync('user.json', JSON.stringify(data,null,2));
};
let testPwd = async user =>{
    const cas = axios.create({
        baseURL: 'http://ca.zucc.edu.cn',
        timeout: 1000,
        httpAgent: new http.Agent({ keepAlive: true }),
        headers:{
            "Host":"ca.zucc.edu.cn",
            "Upgrade-Insecure-Requests":"1",
            "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Mobile/15E148 Safari/604.1",
            "Accept-Language": "zh-cn",
            "Accept-Encoding": "gzip, deflate",   
        }
    });
    let r1 = await cas.get("/cas/login")
    let fj = r1.headers["set-cookie"][0].split(";")[0]
    const params = new URLSearchParams();
    params.append('username', user.id);
    params.append('password', user.pwd);
    params.append('lt', '');
    params.append('execution', 'e1s1');
    params.append('_eventId', 'submit');
    params.append('randomStr', '');
    let r2 =  await cas.post("/cas/login",params,{
        headers:{
            "Origin":"http://ca.zucc.edu.cn",
            "Referer":"http://ca.zucc.edu.cn/cas/login",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie":fj, 
        },
    })
    
    return r2.headers["set-cookie"].length > 1
}
let testLocation = l =>{
    if (typeof(l)==="string"){
        l = l.split(" ")
        if(l.length === 3){
            let v = 0
            try {
               v = city[l[0]][l[1]][l[2]]
            }catch(e){}
            return v===1
        }
    }
    return false
}
app.use(async ctx => {
    if (ctx.method !='POST')return 
    let body = ctx.request.body
    if(ctx.url==='/delete'){
        ctx.body = 'fail'
        try{
            let users = read()
            let n = users.filter(user=>
                user.id != body.id
            );
            write(n)
            ctx.body = 'success'
        }catch(e){console.log(e)}
    }else if(ctx.url==='/add'){
        ctx.body = 'fail'
        if (await testPwd(body)){
            try{
                let users = read()
                if(users.filter(user=>
                    user.id === body.id
                ).length===0){
                    users.push({
                        id:body.id,
                        pwd:body.pwd,
                        location:"校内 校内 校内",
                        auto:"浙江省 杭州市"
                    })
                    write(users)
                    ctx.body = 'success'
                }
            }catch(e){
                console.log(e)
            }
        }else {
            ctx.body = 'password error'
        }
    }else if(ctx.url==='/update'){
        ctx.body = 'fail'
        if (testLocation(body.location)){
            try{
                let users = read()
                let l = body.location.split(" ")
                users.filter(user=>
                    user.id === body.id
                ).forEach(user => {
                    user.location = body.location
                    user.auto =  l[0]+" "+l[1]
                });
                write(users)
                ctx.body = 'success'
            }catch(e){console.log(e)}
        }else{
            ctx.body = 'location error'
        }
    }
});
app.listen(8081);