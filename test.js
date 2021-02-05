let city = require("./city.json")
let s = "浙江省 温州市 永嘉县"
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
console.log(testLocation(s))