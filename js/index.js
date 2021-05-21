var token=null
var voucher=null
var spy_data=null

const user={}
function onSignIn(googleUser) {
    // Useful data for your client-side scripts:
    var profile = googleUser.getBasicProfile()
    user.givenName=profile.getGivenName()
    token = googleUser.getAuthResponse().id_token
    user.mode = "list"
    /*
    console.log("ID: " + profile.getId()); // Don't send this directly to your server!
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log('Family Name: ' + profile.getFamilyName());
    console.log("Image URL: " + profile.getImageUrl());
    console.log("Email: " + profile.getEmail());
    */
   
    show_nav()
    
  }
  function show_nav(){
    const payload={voucher:voucher,token:token,mode:"list"}  
    console.log ("payload",JSON.stringify(payload))
    //document.getElementById("nav").innerHTML = '<div class="message">Welcome ' + user.givenName + '. Getting Activities...'
    document.getElementById("status").innerHTML='<img width="40px" src="images/wait.gif" />'

    fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    }).then(response => response.text())
    .then(payload => {
    
        console.log(payload)
        data=JSON.parse(payload)
        if(data.voucher){voucher=data.voucher}
        
        for(const module_name of data.modules){
            const script = document.createElement('script');
            document.body.appendChild(script);
            //script.onload = resolve;
            //script.onerror = reject;
            //script.async = true;
            script.src = 'js/' + module_name + '.js';
        }
        console.log(data)

        // build the menu structure
        const menu=[]
        const menu_order=[]
        for(const entry of data.activities){
            if(!menu_order.includes(entry[0])){menu_order.push(entry[0])}
            if(!menu[entry[0]]){menu[entry[0]]=[]}
            menu[entry[0]].push(entry[1])
        }
        menu_html='<img id="hourglass" src="images/clear.png"/><ul id="navigation"><li><a onclick="go_home()">Home</a></li>'
        for(const mo of menu_order){
            menu_html+='<li class="sub"><a href="#">' + mo + '</a><ul>'
            for(const mi of menu[mo]){
                menu_html+='<li><a onclick="process_menu(\'' + mo + '\',\'' + mi + '\')">' + mi + '</a></li>'
            }
            menu_html+='</ul></li>'    
        }
        menu_html+='<li><a onclick="signOut()">Sign Out</a></li></ul>'

        document.getElementById("nav").innerHTML = menu_html
        document.getElementById("status").innerHTML= transparent_image()
    })

  }
  function transparent_image(width){
      let pix = 40
      if(width){pix=width}
      return '<img width="' + width + 'px" src="data:image/png;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" />'
  }

  function go_home(){
    document.getElementById("body").innerHTML=`
    <div id="center">
        <img src="images/CH-Foundation-Logo-338.png">
        <div id="status" style="padding-top: 1rem;  display: flex;justify-content: center;">
        </div>
    </div>
    `
  }

  function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      console.log('User signed out.');
      location.reload();  
    });
  }

function update_innerHTML(tag,value){
    tag.innerHTML=value
}


function action(task,tag){
      const payload={voucher:voucher,token:token,mode:"action",task:task}  
      console.log ("payload",JSON.stringify(payload))
      fetch(gas_url, {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'omit', // include, *same-origin, omit
          headers: {
              'Content-Type': 'text/plain;charset=utf-8',
          }
      }).then(response => response.text())
      .then(payload => {
        console.log("payload",payload)
        update_innerHTML(tag,JSON.parse(payload))
      })  
  }



async function process_menu(menu,item){
    console.log("hi")
    
    console.log("menu",menu)
    console.log("item",item)

    // process any menuitems that can be handled locally
    if(menu==="Spy Ring"){
        if(item==="Spy Activities"){
            show_spy_operations()
            return
        }
    }

    // send request to the server
    show_hourglass()
    const payload={voucher:voucher,token:token,mode:"activity",data:{menu:menu,item:item}}  
    fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    }).then(response => response.text())
    .then(payload => {
        console.log("payload",payload) 
        const data1=JSON.parse(payload)
        try {
            data=JSON.parse(data1)
            // if we made it here, there was no error parsing the response as JSON
            console.log(1)
            if(data.redirect){
                console.log(2)
            
                window.open(data.redirect, '_blank');
            }else if(data.method){  // if the google apps script returns a method, just call that method and pass the data
                console.log(3)
            
                this[data.method](data)
            }else{
                console.log(4)
            
                alert("No redirect speficied, and redirect is the only anticipated JSON option")
            }
        } catch (error) {
            console.log(5)
            
        // there was an error.  we assume it was not JSON.  Just use the data to render the page   
        document.getElementById("body").innerHTML = data1
    }

       hide_hourglass()
    })

}

function collapse(data){
    
    document.getElementById("body").innerHTML ='<h1>' + data.title + '</h1><div class="page" id="B"></div>'
    show_statement(data)
}

function toggleImage(image){// toggles the width of an image
  if(image.className==="document-image"){
    image.className="screenwidth-image"
}else if(image.className==="screenwidth-image"){
    image.className="full-image"
}else{
    image.className="document-image"
  }
}

function toggleRow(button){// toggles the next hidden rows that contains the element passed
    console.log(button.tagName) 
    let tag=button
    while(tag.tagName!=="TR"){
        tag=tag.parentElement
    }
    tag=tag.nextSibling
    if(button.innerHTML==="Show"){
        button.innerHTML="Hide"
        tag.className="visible-row"
    }else{
        button.innerHTML="Show"
        tag.className="hidden-row"
    }
}
function show_hourglass(message){
    const img=document.getElementById("hourglass")
    img.src="images/wait.gif"
    img.title=message
}
function hide_hourglass(){
    const img=document.getElementById("hourglass")
    img.src="images/clear.png"
    img.title=""
}

function changeCell(textArea, task){
  show_hourglass()  

  textArea.className = "updating"  
  const payload={voucher:voucher,token:token,mode:"update",task:task,value:textArea.value}  
  console.log ("payload",JSON.stringify(payload))
  fetch(gas_url, {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'omit', // include, *same-origin, omit
      headers: {
          'Content-Type': 'text/plain;charset=utf-8',
      }
  }).then(response => response.text())
  .then(payload => {
    hide_hourglass()
    textArea.className = "editable"  
    console.log("payload",payload)
    //update_innerHTML(tag,JSON.parse(payload))
  })  

}

