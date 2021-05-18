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
function get_mission(mission_id){// looks across all operations to find teh mission id givent
    for([key, operation] of Object.entries(spy_data)){
        for([key, mission] of Object.entries(operation.missions)){
            if(key===mission_id){
              return mission
          }
        }
    }
}
async function update_mission_parameter(id,parameter,value){
    // need to update the mission params 
    const payload={voucher:voucher,token:token,mode:"update_mission", id:id, parameter:parameter, value:value}  
    console.log ("payload",JSON.stringify(payload))
    
    response = await fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    })
    
    const response_load = await response.text()
    console.log("payload",response_load)

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
       const data1=JSON.parse(payload)
       try {
         data=JSON.parse(data1)
          // if we made it here, there was no error parsing the response as JSON
         if(data.redirect){
            window.open(data.redirect, '_blank');
         }else if(data.method){  // if the google apps script returns a method, just call that method and pass the data
            this[data.method](data)
         }else{
             alert("No redirect speficied, and redirect is the only anticipated JSON option")
         }
       } catch (error) {
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

async function fetch_spy_data(){
    show_hourglass("Getting spy data")
    const payload={voucher:voucher,token:token,mode:"server_function",func:"get_spy_data"}  
    console.log ("payload",JSON.stringify(payload))
    response = await fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    })
    
    spy_data=JSON.parse(await response.text())

    // parse the mission parameters
    for(const mission of Object.values(spy_data.missions)){
        if(mission.parameters){
            mission.parameters = JSON.parse(mission.parameters)
        }
    }

    // organize the spy data into operations
    for([key, operation] of Object.entries(spy_data.operations)){
        spy_data[key]=build_op(operation)
    }
    // remove temp spy data
    delete (spy_data.operations)
    delete (spy_data.missions)
    delete (spy_data.tasks)
    delete (spy_data.outcomes)
    console.log("spy_data", spy_data)


    hide_hourglass()

    function build_op(operation){
        const op=JSON.parse(JSON.stringify(operation))
        const task_set=[]
        get_task_list(op.starting_task[0], task_set)
        console.log(task_set)
        // now we have the whole set of tasks for an operation
    
        //next, get the outcomes for each task
        const outcome_set = []
        for(const task_id of task_set){
            for(const outcome_id of get_outcome_ids_for_task(task_id)){
                if(!outcome_set.includes(outcome_id)){
                    outcome_set.push(outcome_id)
                }
            }
    
        }
        console.log("outcome_set",outcome_set)
        //Now we have the set of outcomes for an operation
    
        // next build the stand-alone operation
        op.tasks={}
        for(const task_id of task_set){// add the tasks used in the op
            op.tasks[task_id] = spy_data.tasks[task_id]
        }
        op.outcomes={}
        for(const outcome_id of outcome_set){// add the outcomes used in the op
            op.outcomes[outcome_id] = spy_data.outcomes[outcome_id]
        }
        op.missions={}
        if(op.mission){
            for(const mission_id of op.mission){// add the outcomes used in the op
                op.missions[mission_id] = spy_data.missions[mission_id]
            }
        }
        delete op.mission
        delete op.operation_id
        op.starting_task=op.starting_task[0]

        // find all parameters
        op.parameters = remove_param_tags(JSON.stringify(op).match(/\|=(.*?)=\|/g))

        return op
    
    }
    
    function get_task_list(task_id, task_set){
        //returns an array of all task that follow the task with the given task_id
     
        if(!task_set.includes(task_id)){
            // the supplied task_id is not already in the set
            task_set.push(task_id)
            const outcome_ids = get_outcome_ids_for_task(task_id)
            console.log("outcome_ids",outcome_ids)
    
            for(const outcome_id of outcome_ids){
                console.log("geting the task from an outcome", outcome_id)
                if(spy_data.outcomes[outcome_id].next_task){
                    get_task_list(spy_data.outcomes[outcome_id].next_task[0],task_set)
                }
            }
        }
    
    
    
    }
    function get_outcome_ids_for_task(task_id){
        // gets all of the possible outcomes for a given task
        outcomes=[]
        for([key,outcome] of Object.entries(spy_data.outcomes)){
            if(outcome.task){
                for(const task of outcome.task){
                    if(task===task_id){
                        outcomes.push(key)
                        break
                    }
    
                }
    
            }
        }
        return outcomes
    }


}// end of build spy data


async function show_spy_operations(){
    if(!spy_data){await fetch_spy_data()}// download spy info if needed

    let html='<h1>Spy Activities</h1><div class="cards">'
    for([id,operation] of Object.entries(spy_data)){
        
        let mission_parameters=[]
        if(operation.missions){
          if(Object.values(operation)[0].parameters){   
            mission_parameters=Object.values(operation)[0].parameters
          }
        }
        console.log(id,operation, mission_parameters)
        html+='<div class="card"><div onclick="toggle_missions(\''+id+'\')" class="card-head '
        if(operation.side==="American"){
            html+='us'
          }else{
            html+='brit'
          }
          html+='">'+operation.name+'</div><div class="card-body" id="mission_' + operation.id + '">'
          html+=build_mission_list(operation.id)
          html+='</div><div class="card-foot" id="'+id+'"></div></div>'
        }
        html+='</div>'  
        document.getElementById("body").innerHTML = html
}

function build_mission_list(operation_id){
    const operation=spy_data[operation_id]
    // html='<select  onchange="show_mission(this)"><option value="' + operation.id +'_close">Select Mission</option>'
    // if(operation.missions){
    //     for([key,mission] of Object.entries(operation.missions)){
    //         html += '<option value="' + operation.id + "_" + mission.id + '">' + replace_all(operation.mission_name, mission.parameters) + "</option>"
    //     }
    // }
    // html += "</select>"
    const html=[]
    html.push("<div>")
    if(operation.missions){
        for([key,mission] of Object.entries(operation.missions)){
            html.push('<div class="label-link" onClick="show_mission(\''+operation_id+'\', \''+mission.id+'\')">'+replace_all(operation.mission_name, mission.parameters)+'</div> ')
            html.push('')
            html.push('')
        }
    }
    html.push("</div>")
    return html.join("")
}
function show_mission_list(operation_id){
    document.getElementById("mission_" + operation_id ).innerHTML= build_mission_list(operation_id)
}

function toggle_missions(operation_id){
    const tag=document.getElementById(operation_id)
    if(tag.innerHTML){
        tag.innerHTML = ""
    }else{
        const operation = spy_data[operation_id]
        let html='<select class="hover_invisible" onchange="show_mission(this)"><option value="' + operation_id +'_close">Select Mission</option>'
        if(operation.missions){
            for([key,mission] of Object.entries(operation.missions)){
                //params=JSON.parse(mission.parameters)
                //console.log(params)
                //html += '<button onclick="show_mission(\''+operation_id+'\',\'' + mission.id + '\')">' + replace_all(operation.mission_name, mission.parameters) + "</button>"
                html += '<option value="' + operation_id + "_" + mission.id + '">' + replace_all(operation.mission_name, mission.parameters) + "</option>"
                
            }
        }
        html += "</select>"
        tag.innerHTML = html + '<div class="spy-mission" id="mission_'+operation_id+'"></div>'
    }
}

function show_mission(operation_id,mission_id){
  const tag=document.getElementById('mission_'+operation_id)
  if(mission_id==="close"){
    tag.innerHTML=""
    return
  }
  const html=[]
  const operation=spy_data[operation_id]
  const mission=operation.missions[mission_id]

  console.log("mission_id",mission_id)
  console.log("mission",mission)
  console.log(mission.parameters)
  
  for([key,value] of Object.entries(mission.parameters)){
      console.log (key, value)
  }
  
//   for(const param of operation.parameters){
//       console.log(param)
//       html.push(param+'<input type="text" value="')
//       if(mission_parameters[param]){html.push(mission_parameters[param])}
//       html.push('"><br />')
//   }


  
  const task_array=[]
  sequence_tasks(operation, task_array)
  let task_count=0
  let include_description=true
  for(const task_id of task_array){
    if(task_count++>0){include_description=false}  
    html.push(render_task(operation, mission_id, task_id, include_description))
  }
  html.push('<div><button onclick="publish_mission(\'' + operation.id + '\',\'' + mission_id + '\')">Publish</button> ')
  html.push('<button onclick="alert(\'Duplicating\')">Duplicate</button> ')
  html.push('<button onclick="show_mission_list(\''+operation.id+'\')">Close</button></div>')
  tag.innerHTML=html.join("")
}
async function publish_mission(operation_id, mission_id){
    const mission={}
    const operation=spy_data[operation_id]
    console.log("mission", mission_id)
    const param_values=operation.missions[mission_id].parameters
    console.log("param_values", param_values)
    mission.spy_limit = operation.missions[mission_id].spy_limit
    mission.operation = operation.name
    mission.side = operation.side
    mission.starting_task = operation.starting_task
    mission.active = operation.missions[mission_id].active
    mission.name = parameter_inection(operation.mission_name, param_values)
    mission.description = parameter_inection(operation.description, param_values)
    mission.outcomes = JSON.parse(parameter_inection(JSON.stringify(operation.outcomes),param_values))
    mission.tasks = JSON.parse(parameter_inection(JSON.stringify(operation.tasks),param_values))
    
    // console.log("at pub mission",mission)
    
    // const outcomes={}
    // for([key,value] of Object.entries(mission.outcomes)){
    //     outcomes[key]={"M":{response:{"S":outcome.response}}}
    // }
    // console.log("outcomes",JSON.stringify(outcomes))

    const payload={  voucher:voucher,
                     token:token,
                     mode:"publish_mission",
                     operation:mission.operation,
                     spy_limit:mission.spy_limit.toString(),
                     side:mission.side,
                     starting_task:mission.starting_task,
                     name:mission.name,
                     description:mission.description,
                     tasks:JSON.stringify(mission.tasks),
                     outcomes:JSON.stringify(mission.outcomes)
                  }  
    console.log ("payload",JSON.stringify(payload))
    
    response = await fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    })
    
    const response_load = await response.text()
    console.log("payload",response_load)



}

function render_task(operation, mission_id, task_id, include_description){
    const mission = operation.missions[mission_id]
    const task = operation.tasks[task_id]    
    const html=[]
    //console.log("operation.description",operation.description)
    if(include_description){
        html.push('<div class="data-label">'+operation.mission_name+'</div>')
        html.push('<div class="data-field">' + operation.description + '</div>')
        html.push('</div>')
    }
    html.push('<div id="'+task_id+'" class="task-name">')
    html.push(task.name)
    html.push('</div><div class="task">')
    html.push(task.description)
    html.push('</div>')
    if(task.outcome){
        html.push('</div><div class="outcomes">')
        console.log("==========>>>>>>> at task",task)
        for(const outcome of task.outcome){
            html.push('<div class="outcome">')
            html.push(operation.outcomes[outcome].description)
                html.push('<div class="outcome-detail">')
                html.push(operation.outcomes[outcome].response)
                if(operation.outcomes[outcome].next_task){
                    const next_task_id=operation.outcomes[outcome].next_task
                    console.log(".......at next task:", next_task_id)
                    console.log("next task:", operation.tasks[next_task_id])
                    if(operation.tasks[next_task_id]){
                      html.push("<hr>Next Task: " + '<a href="#' + next_task_id + '">' + operation.tasks[next_task_id].name + '</a>')
                    }
                }else{  
                    html.push("<hr><strong>End of mission.</strong>")
                }
                html.push('</div>')
            html.push('</div>')
        }
        html.push('</div>')
    }

    console.log("html",html)

    let data=html.join("") // a fresh copy of the operation task ready to be configured for the current mission
    console.log("operation.parameters",operation.parameters)
    for(const param of operation.parameters){
        if(data.includes('|='+param+'=|')){
            let value=param
            let parameter_class="unassigned-parameter-display"
            let param_status="empty"
            if(mission.parameters[param]){
                console.log("-->found a match", param, mission.parameters[param])
                value=mission.parameters[param]
                parameter_class="parameter-display"
                param_status="filled"
            }
       
            
            //let tag='<input id="' + param.split(" ").join("_") + '_~id_index~" name="' + param.split(" ").join("_") + '"  value="' + value + '" onchange="change_parameter(this)" onkeyup="type_parameter(this)">'
            let tag='<div data-status="' + param_status + '" data-mission="' + mission_id + '" class="'+parameter_class+'" id="' + task.id + '_' + param.split(" ").join("_") + '_~id_index~" name="' + param.split(" ").join("_") + '"  onclick="enter_parameter(this)">' + value + '</div>'
            var data_array=data.split('|='+param+'=|')    

            // interleve the tags to the description array
            for(let x=data_array.length-1;x>0;x--){
              data_array.splice(x, 0, tag.replace("~id_index~",x))
            }

            data=data_array.join("")


        }

    }

    return data
}

function parameter_inection(the_data, values){
    // the_data: parameterized text    
    // values: an object where parameter names equal parameter values
    const full_params=the_data.match(/\|=(.*?)=\|/g)
    if(!full_params){return the_data}// no parametres found, nothing to replace
    let data=the_data// local copy to allow isolated changes
    let parameters = remove_param_tags(full_params)
    for(const param of parameters){
        if(data.includes('|='+param+'=|')){
            let value="EMPTY"
            if(values[param]){value=mission.parameters[param]}
            var data_array=data.split('|='+param+'=|')    

            // interleve the tags to the description array
            for(let x=data_array.length-1;x>0;x--){
              data_array.splice(x, 0, values[param])
            }
            data=data_array.join("")
        }
    }
    return data

}

function enter_parameter(tag){
    const tag_width=tag.offsetWidth
    console.log("at enter parameter", tag_width)
    let value=tag.innerHTML
    tag.className = "parameter-editing"
    tag.innerHTML='<input class="parameter-input" style="width:' + tag_width + 'px" onblur="exit_parameter(this)" onclick="suppress_event(event)" onchange="change_parameter(this)">'
    tag.firstChild.focus()
    tag.firstChild.value=value
}
function exit_parameter(tag){
    const container = tag.parentElement
    if(!container){return}// if we have already updated this element becausae the use change the value, we don't need to do antying here
    let value=tag.innerHTML
    console.log(container)
    console.log(container.getAttribute("data-status"))
    if(container.getAttribute("data-status")==="empty"){
        console.log(333)
        container.className = "unassigned-parameter-display"  
    }else{
      container.className = "parameter-display"
    }
    container.innerHTML=tag.value
}


function suppress_event(evt){
    evt.stopPropagation()
}


async function change_parameter(tag){
    const parent=tag.parentElement
    const name=tag.parentElement.getAttribute("name")
    const value=tag.value
    const id = tag.parentElement.getAttribute("data-mission")
    const parameter = name.split("_").join(" ")

    console.log("at change_parameter",id)
    // need to find all parameters with the same value and update
    const tags=document.getElementsByName(tag.parentElement.getAttribute("name"))
    for(const pill of tags){
        pill.innerHTML = value
        pill.className = "parameter-updating"
    }
    // need to update the parameters in spy_data
    const mission = get_mission(id)
    //console.log("params===============================", mission.parameters)
    mission.parameters[parameter] = value
    // need to update the parameter on airtable
    await update_mission_parameter(id,parameter,value)
    for(const pill of tags){
        pill.className = "parameter-display"
    }
    
    
}

function sequence_tasks(operation, task_array, task_id){
    //operation and task_array must be passed in on the initial call, task_id need not
    //task_array shoudl be a refernce to an array that will hold the task_ids in sequence
    
    if(!task_id){task_id=operation.starting_task}

    const task = operation.tasks[task_id] 
    //console.log("task",task)
    task_array.push(task_id)
    if(task.outcome){// tasks only have outcomes if there is something else to report
        for(const outcome_id of task.outcome){
            const outcome = operation.outcomes[outcome_id]
            if(outcome.next_task){
                for(const out_task of outcome.next_task){
                    if(!task_array.includes(out_task)){
                    sequence_tasks(operation,  task_array, out_task)
                    }
                }
            }

        }
    }


}


function replace_all(data, instructions){
    // returns data with keys in instruction replaced wiht values
    let new_data=data
    for([key,value] of Object.entries(instructions)){
    	//console.log(key, value)
        new_data=new_data.split("|=" + key + "=|").join(value)
    }
    return new_data
}

function remove_param_tags(params){
    const x=[]
    for(const param of params){
        if(!x.includes(param.substr(2,param.length-4))){  // no need for duplicates in parameters

            x.push(param.substr(2,param.length-4))
        }
    }
    return x
}
