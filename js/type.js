var inputField=document.getElementById("texter");
var typeit=document.getElementById("typer");


inputField.addEventListener("input",(event)=>{
    typeit.innerHTML=event.target.value;
});


window.onclick=()=>{
    inputField.focus();
}