const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  })

function account_total(account){

    if(Array.isArray(account.value)){
        let total=0
        for(const acct of account.value){
            total+=account_total(acct)
        }
        account.total=total 
        
    }else{
        account.total = account.value
    }
    console.log(account.name, account.total)
    return account.total
}

function show_data(element,account){
    let elem = add_child(element,account.name,  formatter.format(account.total))
    //console.log("elem", elem)
    if(Array.isArray(account.value)){
        for(const acct of account.value){
            //console.log("acct.name",acct.name)
            //console.log("acct.value",acct.value)
            show_data(elem,acct)
        }
    }
}




async function show_statement(data){

    
    account_total(data)

    //console.log("acct structure", data.value[0])
    const container = document.getElementById("B")

    for(const entry of data.value){
        show_data(container, entry)
        container.appendChild(document.createElement("br"))    
    }

    var coll = document.getElementsByClassName("collapsible");

    var i;
    
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function(e) {
            e.stopPropagation()
            var content = this.children[1];
            // console.log("content",content)
            // console.log("content.id",content.id)
            // console.log("content.style.display",content.style.display)
            if (content.style.display === "block") {
                content.style.display = "none";
                this.children[0].style.borderBottom ="none"
            } else {
                content.style.display = "block";
                this.children[0].style.borderBottom ="thin dashed #000"
            }
        });
    }

    coll = document.getElementsByClassName("content");
    for (i = 0; i < coll.length; i++) {
        // just need to prevent a click from going up the chain
        coll[i].addEventListener("click", function(e) {
            //console.log("at stop prop")
            e.stopPropagation()
        });
    }



}



function add_child(node, label, value){
    const smalldiv=new_div(new_div(document.createTextNode(label), "label"))
    smalldiv.appendChild(new_div(document.createTextNode(value), "number")) 
    if(node.firstChild && node.firstChild.firstChild){
    console.log("node.firstChild.className",node.firstChild.firstChild.className)
    }
    const newDiv =new_div(new_div(smalldiv), "content") 
    console.log("node", node)
    if(node.className==="page"){
        // this is a top level node, it is not clickable
        node.appendChild(newDiv);
    }else if(node.firstChild.className!=="collapsible"){
        // adding to an existing text node. need to convert the parent
        let div1=node.firstChild
        div1.className="collapsible"
        div1.appendChild(new_div(newDiv,"child-container"))
        console.log("dov1",div1)
    }else{ 
        console.log("adding a subsequetn data blaock to a")
        let div1=node.getElementsByClassName("child-container")[0]
        div1.appendChild(newDiv)

    }
    return newDiv
}

function new_div(content, className){
    const newDiv = document.createElement("div");
    if(className){
        newDiv.classList.add(className);
    }
    newDiv.appendChild(content);
    return newDiv;
  
}
