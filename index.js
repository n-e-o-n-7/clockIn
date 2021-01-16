let axios = require('axios');
let http = require('http');
let users = require("./user")

function getToday(){
    let t = 8;
    const time = new Date();
    const len = time.getTime();
    const offset = time.getTimezoneOffset() * 60000; 
    const utcTime = len + offset;  
    const date = new Date(utcTime + 3600000 * t);
    const y = date.getFullYear(),
        mon = date.getMonth() + 1,
        d = date.getDate();
    function addZero(value) {
        if (value < 10) return "0" + value;
        else return value;
    }
    return y + "-" + addZero(mon) + "-" + addZero(d);
}
async function clockIn(user){
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
    let sj = r2.headers["set-cookie"][0].split(";")[0]
    let ca = r2.headers["set-cookie"][2].split(";")[0]
    let r3 = await cas.get("/cas/login?service=http%3A%2F%2Fyqdj.zucc.edu.cn%2Ffeiyan_api%2Fh5%2Fhtml%2Fdaka%2Fdaka.html",{
        headers:{
            "Cookie":ca + " " + sj,
        }
    })
    let tjo = r3.request.path.split(";")[1]
    let tjt = "JSESSIONID="+tjo.split("=")[1]
    const yq = axios.create({
        baseURL: 'http://yqdj.zucc.edu.cn/feiyan_api',
        timeout: 1000,
        httpAgent: new http.Agent({ keepAlive: true }),
        headers:{
            "Host":"yqdj.zucc.edu.cn",
            "Accept":"application/json",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Mobile/15E148 Safari/604.1",
            "Accept-Language": "zh-cn",
            "Accept-Encoding": "gzip, deflate",      
            "Origin": 'http://yqdj.zucc.edu.cn',
            "Referer": 'http://yqdj.zucc.edu.cn/feiyan_api/h5/html/daka/daka.html;'+tjo,
            "Cookie":tjt,

            "Upgrade-Insecure-Requests":"1",
            "Content-Type": "application/json;charset=utf-8",
        }
    });
    let data = {
        "examenTitle": "师生报平安",
        "answer": {
            "填报日期":getToday(),
            "目前所在地":user.location,
            "近14天是否有与疫情中、高风险地区人员的接触史？":"否",
            "近14天是否有与疑似、确诊人员的接触史?":"否",
            "近14天是否到过疫情中、高风险地区？":"否",
            "现是否处于医学观察状态？":"否",
            "若处于医学观察状态，请填写隔离地点和隔离起始时间？":"",
            "现是否处于居家隔离状态？":"否",
            "若处于居家隔离状态，请填写隔离地点和隔离起始时间？":"",
            "现身体状况，是否存在发热体温、寒战、咳嗽、胸闷以及呼吸困难等症状？":"否",
            "同住家属近14天是否有与疫情中、高风险地区人员的接触史？":"否",
            "同住家属近14天是否有与疑似、确诊人员的接触史？":"否",
            "同住家属近14天是否到过疫情中、高风险地区？":"否",
            "同住家属现是否处于医学观察状态?":"否",
            "今日申领学校所在地健康码的颜色? What's the color of today's health code?":"绿码(Green code)",
            "本人或家庭成员(包括其他亲密接触人员)是否有近14日入境或未来7日拟入境的情况?Have you or your family members(including other close contact persons) entered China over the past 14 days or plan to enter China in 7 days?":"否 No",
        },
        "examenSchemeId": 2
    }
    let r4 = await yq.post("/examen/examenAnswerController/commitAnswer.do?Rnd="+Math.random()+"&_="+Math.random(),data)
    // let r4 = await yq.post("/auth/authController/getUserInfo.do?Rnd="+Math.random()+"&_="+Math.random())
    return r4.data.message
}

(async ()=>{
    for (user of users) {
        user.state = await clockIn(user)
    }
    console.log(users.map(user=>{
        return {
            name:user.name,
            state:user.state?user.state:"fail"
        }
    }))
})()