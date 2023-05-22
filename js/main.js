var cmd=document.getElementById("command");
var terminal=document.getElementById("terminal");
var before=document.getElementById("before");
var command=document.getElementById("typer");
var textarea=document.getElementById("texter");

var executed_cmds=[];
var execPos=0;

//Adding Banner
setTimeout(() => {
    addBanner(banner,100);
}, 100);

function addBanner(line,time) {
    line.forEach(function(item,index){
        everyLine(item,index*time);
    });
};

function everyLine(text,time) {
    var t="";
    for (let i = 0; i < text.length; i++) {
        if (text.charAt(i) == " ") {
          t += "&nbsp;";
        } else {
          t += text.charAt(i);
        }
      }
    setTimeout(function () {
        var next = document.createElement("div");
        next.classList.add("banner");
        next.innerHTML = t;
        terminal.appendChild(next);
      }, time);
}

//Added Subtext
addElement(subtext,900);


cmd.addEventListener("keyup",enter);


function enter(e) {
    if(e.keyCode==13) { //Enter is pressed
        executed_cmds.push(command.innerHTML);
        execPos=executed_cmds.length;
        
        var temp=document.createElement("p");
        temp.classList.add("terminal-cmd");
        temp.innerHTML="terminal@fatih:~$ "+command.innerHTML;
        terminal.appendChild(temp);
        
        executor(command.innerHTML.toLowerCase().trim());
        command.innerHTML="";
        textarea.value="";
    } else if(e.keyCode==38 && execPos!=0){ //Up key
        execPos--;
        textarea.value=executed_cmds[execPos];
        command.innerHTML=executed_cmds[execPos];
    } else if(e.keyCode==40 && execPos!=executed_cmds.length) {//Down key
        execPos++;
        if(executed_cmds[execPos]===undefined){
            textarea.value="";
        } else {
            textarea.value=executed_cmds[execPos];
        }
        command.innerHTML=textarea.value;
    }
}

function executor(cmd) {
    switch (cmd) {
        case(""):
            addElement("",100);
            break;
        case "help":
            addElement(help,100);
            break;
        case "whoami":
            addElement(whoami,100);
            break;
        case "experience":
            addElement(experience,100);
            break;
        case "skills":
            addElement(skills,100);
            break;
        case "clear":
            clear();
            break;
        default:
            addElement(error,100);
            break;
    }
}


function addElement(name,time) {
    setTimeout(function () {
        var next = document.createElement("div");
        next.classList.add("typed-out");
        next.innerHTML = name;
        terminal.appendChild(next);
        window.scrollTo(0,document.body.offsetHeight);
      }, time);
}

const clear = () => {
  setTimeout(()=>{
    while(terminal.childElementCount>8){
        terminal.removeChild(terminal.lastChild);
    }
  },100)
}
