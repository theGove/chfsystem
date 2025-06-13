// culper.web.app
//owned by gove@clonailhertiage.org: spechelo
const speech_url="https://script.google.com/macros/s/" +
//"AKfycbxJ__m5sCUF3pRj8npa0_KMcvpa0rxWQFvebhbwsS31sxpFxXuJvVGjQ-OwYjyCncNi" +
"AKfycbxtXRUlcpwM44raa6cGhy219kHLDz1SwOMKPRLHWyv_Ur2f1eMdSgin-aVnQMOrBDej"+
"/exec"

async function get_voice_url(mission_id, text, speaker, language, campaign, tone){
    console.log("===========================================")
    console.log(speaker)
    console.log(text)
    console.log("===========================================")
    
    

    if(!campaign){campaign=237356}//culper
    if(!tone){tone="normal"}//culper
    if(!speaker){speaker="Brian"}//british dude
    if(!language){language="en-GB"}//british


    //speaker=document.getElementById("voice").value
    if(!document.getElementById("rebuild_voice").value ){

        // check to see if we alread have this audio on dynamodb
        let audio=await get_mission_audio(mission_id, text)
        console.log("raw audio", audio)
        //audio=JSON.parse(audio)

        console.log("audio",audio, !!audio, audio.length, audio.slice(-3).toLowerCase())

        if(audio.slice(-3).toLowerCase()==="mp3"){return audio}  // if dynamoDB had the url for this mission and text, no neet to make it

    }

     console.log("after audio exit")
    // audio does not already exist, make it

    const payload={text:text, speaker:speaker, tone:tone, campaign:campaign, language:language}
    let body=JSON.stringify(payload)
    //body='{"text","Hessian soldiers just might switch sides if they knew how much better life in America is!","speaker":"Emma","tone":"normal","campaign":237356,"language":"en-GB"}'
    console.log ("payload",body)
    console.log("speech_url",speech_url)
    
    const request={
        method: 'POST',
        body: body,
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    }
    console.log (request)
    response = await fetch(speech_url, request)
    
    const response_load = await response.text()
    console.log("responseload",response_load)

    console.log("about to remember audio")  
    const remembered=await remember_mission_audio(mission_id, text, JSON.parse(response_load))
    console.log("remembered", remembered)
    return response_load

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

async function update_mission_field(id,field,value, data_type){
    // need to update the mission params 
    let val=value
    if(data_type==='int'){
        val=parseInt(value)
    }else if (data_type==='float'){
        val=parseFloat(value)
    }
    const payload={voucher:voucher,token:token,mode:"update_mission", id:id, column:field, value:val}  
    console.log ("payload",JSON.stringify(payload))
    
    response = await fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    })
    try{
      const response_load = await response.text()
      console.log("payload",response_load)
      // updated database, now update local cache
      const mission=get_mission(id)
      mission[field]=val

      return true
    }catch(e){
      return e
    }

}



async function duplicate_mission(id){
    
    const payload={voucher:voucher,token:token,mode:"duplicate_mission", mission_id:id}  
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
        console.log("operaiont", op)
        const task_set=[]
        if(op.starting_task){
          get_task_list(op.starting_task[0], task_set)
        }
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
        if(op.starting_task){
            op.starting_task=op.starting_task[0]
        }
        

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

async function set_mission_activity(tag){
    console.log("at set spy_mission_activity")
    document.getElementById(tag.getAttribute("data-operation_id")+"_"+tag.getAttribute("data-mission_id")+"_"+tag.getAttribute("data-column")).innerHTML =  '<img src="/images/wait.gif" width="20">'
    const payload={  voucher:voucher,
        token:token,
        mode:"set_mission_activity",
        operation_id:tag.getAttribute("data-operation_id"),
        mission_id:tag.getAttribute("data-mission_id"),
        increment:tag.getAttribute("data-increment"),
        column:tag.getAttribute("data-column")
    }  
    console.log ("Payload",JSON.stringify(payload))

    response = fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        }
    }).then(response => response.text())
    .then(response_load => {
        console.log("payload",response_load)
        resp=JSON.parse(response_load)
        console.log("returned", resp.data.Attributes[tag.getAttribute("data-column")])
        if(resp.data && resp.data.Attributes &&  resp.data.Attributes[tag.getAttribute("data-column")]){
            document.getElementById(tag.getAttribute("data-operation_id")+"_"+tag.getAttribute("data-mission_id")+"_"+tag.getAttribute("data-column")).innerHTML =  resp.data.Attributes[tag.getAttribute("data-column")].N
        }else{
            alert("error updating: " + response_load)
        }

    })  


    

}
async function show_spy_mission_activity(payload){
  console.log("at show_spy_mission_activity", payload)
  if(!spy_data){await fetch_spy_data()}// download spy info if needed
  const operations={}
  for(const item of payload.data.Items){
    console.log("item", item)
    if(!operations[item.operation.S]){operations[item.operation.S]={
        operation_name:item.operation_name.S,
        missions:{}
    }}
    operations[item.operation.S].missions[item.mission.S]=item
   // spy_data[item.operation.S].missions[item.mission.S].active=item.active_spies.N
  }
  console.log("operations",operations)
  console.log("spy_data",spy_data)
  const html=[]
  html.push('<h1>Spy Mission Control</h1><div class="cards">')
  for([operation_id, operation]of Object.entries(operations)){
    

    html.push('<div class="card"><div class="card-head ')
    if(spy_data[operation_id].side==="American"){
      html.push('us')
    }else{
      html.push('brit')
    }
    html.push('">'+operation.operation_name+'</div><div class="card-body">')
    for([mission_id, mission]of Object.entries(operation.missions)){
        html.push("<div>")    
        html.push(mission.mission_name.S + "<br />")    
        html.push('<table class="spy-activity-table"><tr>')    


        html.push('<td>&nbsp;</td><td>Active</td><td><input type="checkbox" name="active" data-id='+mission_id+'" data-set="mission" data-type="bool" onchange="activate_mission(\''+operation_id+'\',\''+mission_id+'\',this.checked)" value="True"')
        if(mission.active.BOOL){
            html.push(" checked")
        }
        html.push('></td><td id="'+operation_id + '_' + mission_id + '_active">')
        html.push('</td>')    



        html.push("</tr></tr>")    
        html.push('<td>&nbsp;</td><td>Spy Limit</td><td><img data-increment="1" data-operation_id="'+operation_id+'" data-mission_id="'+mission_id+'" data-column="spy_limit" style="cursor:pointer" onclick="set_mission_activity(this)" width="20" src="/images/up-arrow.png"></td><td id="'+operation_id + '_' + mission_id + '_spy_limit">')
        html.push(mission.spy_limit.N)    
        html.push('</td><td><img data-increment="-1" data-operation_id="'+operation_id+'" data-mission_id="'+mission_id+'" data-column="spy_limit" style="cursor:pointer" onclick="set_mission_activity(this)" width="20" src="/images/down-arrow.png"></td><td id="mission_'+mission_id+'"></td>')    
        
        // html.push("</tr></tr>")    
        // html.push('<td>&nbsp;</td><td>Active Spies</td><td><img data-increment="1" data-operation_id="'+operation_id+'" data-mission_id="'+mission_id+'" data-column="active_spies" style="cursor:pointer" onclick="set_mission_activity(this)" width="20" src="/images/up-arrow.png"></td><td id="'+operation_id + '_' + mission_id + '_active_spies">')
        // html.push(mission.active_spies.N)    
        // html.push('</td><td><img data-increment="-1" data-operation_id="'+operation_id+'" data-mission_id="'+mission_id+'" data-column="active_spies" style="cursor:pointer" onclick="set_mission_activity(this)" width="20" src="/images/down-arrow.png"></td><td id="mission_'+mission_id+'"></td>')    
        
        html.push("</tr></table>")    
        html.push("</div>")    
      }
  
      html.push('</div><div class="card-foot"></div></div>')
  
  }
  html.push("</div>")
  document.getElementById("body").innerHTML = html.join("")

}


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
        html+='<div class="card"><div class="card-head '
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
            const the_date = new Date(mission.createdTime)
            html.push('<div class="label-link" onClick="show_mission(\''+operation_id+'\', \''+mission.id+'\')">'+replace_all(operation.mission_name, mission.parameters)+' <span class="slight">'+the_date.toString()+'</span></div> ')
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

async function show_mission(operation_id,mission_id){
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
    if(task_id){
        if(task_count++>0){include_description=false} 
        console.log("task_id",task_id) 
        html.push(render_task(operation, mission_id, task_id, include_description))
    }else{
        html.push("<div>undefined task</div>")
    }
  }
  html.push('<div>')


  const mission_active=await get_mission_status(operation_id,mission_id)

  html.push('Spy Limit: <input name="spy_limit" data-id="'+mission.id+'" data-set="mission" data-type="int" onchange="update_column(this)" size="4" value="'+mission.spy_limit+'"> ')
//   html.push('&nbsp;&nbsp;Active: <input type="checkbox" name="active" data-id="'+mission.id+'" data-set="mission" data-type="bool"  onchange="activate_mission(\''+operation_id+'\',\''+mission_id+'\',this.checked)" value="True" ')
//   if(mission_active){
//     html.push(" checked")
//   }

//   html.push('> ')
  html.push('<select id="rebuild_voice"><option value="false" checked>Build edited text</option><option value="true">Rebuild All Voice</option></select> ')
  //html.push('<select id="voice"><option value="Brian" checked>Brian</option><option value="Emma">Emma</option></select> ')
  html.push('<button onclick="publish_mission(\'' + operation.id + '\',\'' + mission_id + '\')">Publish</button> ')
  html.push('<button onclick="duplicate_mission(\''+mission_id+'\')">Duplicate</button> ')
  html.push('<button onclick="show_mission_list(\''+operation.id+'\')">Close</button></div>')
  html.push('<span id="message_'+mission_id+'"></span')
  tag.innerHTML=html.join("")
}
async function update_column(tag){
   console.log(tag.value)
   console.log(tag.getAttribute("data-id"))
   console.log(tag.getAttribute("data-set"))
   console.log(tag.getAttribute("data-type"))
   let val=tag.value
   if (tag.getAttribute("data-type")==="bool"){
       val=tag.checked
   }
    if (tag.getAttribute("data-set")==='mission'){
        tag.style.backgroundColor="gray"
        const resoponse = await update_mission_field(tag.getAttribute("data-id"),tag.name,val,tag.getAttribute("data-type"))
        if(response){
            tag.style.backgroundColor="white"
        }else{
            tag.style.backgroundColor="red"
        }
        
    }
    

}

async function activate_mission(operation_id, mission_id, active){
    console.log("at activate mission")
    document.getElementById(operation_id+"_"+mission_id+"_active").innerHTML =  '<img src="/images/wait.gif" width="20">'

    const payload={  voucher:voucher,
        token:token,
        mode:"activate_mission",
        operation_id:operation_id,
        mission_id:mission_id,
        active:active
    }  
    console.log ("Payload",JSON.stringify(payload))

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
    resp=JSON.parse(response_load)
    if(resp.status==="success"){
        document.getElementById(operation_id+"_"+mission_id+"_active").innerHTML = ""
    }else{
        alert("Error: " + response_load)
    }

}

async function remember_mission_audio(mission_id, text, url){
    const payload={  voucher:voucher,
        token:token,
        mode:"remember_mission_audio",
        mission:mission_id,
        text:text,
        url:url
    }  
    console.log ("Payload",JSON.stringify(payload))

    response = await fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        }
    })

    const response_load = await response.text()
    console.log("remembering",response_load)

}



async function get_mission_status(operation_id, mission_id){
    const payload={  voucher:voucher,
        token:token,
        mode:"get_mission_status",
        operation_id:operation_id,
        mission_id:mission_id
    }  
    console.log ("Payload",JSON.stringify(payload))

    response = await fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        }
    })

    const response_load = await response.text()
    let resp
    try{
        resp=JSON.parse(response_load)
    }catch(e){
        return e
    }

    console.log("resp",resp)
    if(resp.Item){
        return resp.Item.active.BOOL
    }else{
        return resp
    }

}


async function get_mission_audio(mission_id, text){
    const payload={  voucher:voucher,
        token:token,
        mode:"get_mission_audio",
        text:text,
        mission_id:mission_id
    }  
    console.log ("Payload",JSON.stringify(payload))

    response = await fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        }
    })
    const result = await response.text()
    //console.log("result",result, JSON.parse(result))
    return JSON.parse(result)
}





async function publish_mission(operation_id, mission_id){
    console.log("at publish mission")
    const mission={}
    const operation=spy_data[operation_id]
    console.log("--------mission", mission_id)
    const param_values=operation.missions[mission_id].parameters
    console.log("Param Values", param_values)
    
    mission.spy_limit = operation.missions[mission_id].spy_limit
    mission.operation = operation.name
    mission.side = operation.side
    mission.age = operation.age
    mission.starting_task = operation.starting_task
    mission.active = false
    if(operation.missions[mission_id].active){mission.active=true}
    mission.name = parameter_inection(operation.mission_name, param_values)
    mission.description = parameter_inection(operation.description, param_values)
    mission.outcomes = JSON.parse(parameter_inection(JSON.stringify(operation.outcomes),param_values))
    const injected = parameter_inection(JSON.stringify(operation.tasks),param_values)
    console.log("injected", injected)
    mission.tasks = JSON.parse(injected)

    console.log("################mission#################", mission) 

    for([key,outcome] of Object.entries(mission.outcomes) ){
        console.log("key", key)
        html("message_" + mission_id,"Getting Misssion Audio for: " + outcome.response)
        mission.outcomes[key].audio = await get_voice_url(mission_id, outcome.response, operation.voice)

    }

    for([key,task] of Object.entries(mission.tasks) ){
        console.log("TASK$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$",task)
        html("message_" + mission_id,"Getting Misssion Audio for: " + task.description)
        mission.tasks[key].audio = await get_voice_url(mission_id, task.description, operation.voice)
        if(param_values["expiry_"+key]){
            mission.tasks[key].minutes_or_expiry = parseInt(param_values["expiry_"+key])
        }else{
           mission.tasks[key].minutes_or_expiry = operation.tasks.minutes_to_expire
        }
    }


    html("message_" + mission_id,"Getting Misssion Audio")

    mission.audio=await get_voice_url(mission_id, mission.description, operation.voice)
    html("message_" + mission_id,"Done")

    console.log("amended mission ***********************", mission)

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
                     active:mission.active.toString(),
                     side:mission.side,
                     starting_task:mission.starting_task,
                     name:mission.name,
                     mission_id:mission_id,
                     age:mission.age,
                     operation_id:operation_id,
                     description:mission.description,
                     description_audio:mission.audio,
                     tasks:JSON.stringify(mission.tasks),
                     outcomes:JSON.stringify(mission.outcomes)
                  }  
    console.log ("===================================================================================================")
    console.log ("Publish mission Payload",JSON.stringify(payload))
    
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

function html(id, text){
    document.getElementById(id).innerHTML=text
}
async function change_expiry(tag){
    const parameter=tag.getAttribute("data-parameter")
    const id = tag.getAttribute("data-mission_id")
    const value=tag.value
    const mission = get_mission(id)
    //console.log("params===============================", mission.parameters)
    mission.parameters[parameter] = value
    // need to update the parameter on airtable
    if(!isNaN(value)){
      await update_mission_parameter(id,parameter,parseInt(value))
    }
}
async function change_expiry_time(tag){
    const parameter=tag.getAttribute("data-parameter")
    const id = tag.getAttribute("data-mission_id")
    const value=tag.value
    const mission = get_mission(id)
    //console.log("params===============================", mission.parameters)
    console.log("change_expiry_time-->value", value)
    const d=new Date(value)
    var sec = Math.floor( d / 1000 )

    mission.parameters[parameter] = sec
    // need to update the parameter on airtable
    await update_mission_parameter(id,parameter,parseInt(sec))
     
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
    html.push('</div>')
    let expiry = task.minutes_to_expire

    if(mission.parameters['expiry_'+task.id]){
        expiry = mission.parameters['expiry_'+task.id]
    }
    let d = new Date(0)
    if(expiry>500){
        // this is an absolute time
        var minutes_class="hidden"
        var time_class="visible"
        
        d.setUTCSeconds(expiry);
        

    }else{
        // this is number of minutes since task started
        var minutes_class="visible"
        var time_class="hidden"
        let d2=new Date()
        d.setUTCSeconds(Math.round(d2.getTime() / 1000) + (expiry*60))

    }
    Number.prototype.AddZero= function(b,c){
        var  l= (String(b|| 10).length - String(this).length)+1;
        return l> 0? new Array(l).join(c|| '0')+this : this;
     }//to add zero to less than 10,

    let        localDateTime= [d.getFullYear(),
        (d.getMonth()+1).AddZero(),
        d.getDate().AddZero()
        ].join('-') +'T' +
       [d.getHours().AddZero(),
        d.getMinutes().AddZero()].join(':');

console.log("the date: ", localDateTime)

    html.push('<div class="'+minutes_class+'" id="ex_min_' + mission.id + '_' + task.id + '">')
    html.push('Minutes to Expire: <input data-parameter="expiry_'+task.id+'" data-mission_id="'+mission.id+'" onchange="change_expiry(this)" id="input_minutes_' + mission.id + '_' + task.id + '" type="text" size="4" name="meeting-time" value="' + expiry + '"/>')
    html.push('</div>')



    html.push('<div class="'+time_class+'" id="ex_time_' + mission.id + '_' + task.id + '" >')
    html.push('Expire at time: <input type="datetime-local" data-parameter="expiry_'+task.id+'" data-mission_id="'+mission.id+'" id="input_time_' + mission.id + '_' + task.id + '" onchange="change_expiry_time(this)" value="'+ localDateTime +'"  />')
    
    html.push('</div>')


    html.push('<div class="visible">')

    html.push('<input onclick="document.getElementById(\'ex_min_' + mission.id + '_' + task.id + '\').className=\'visible\';document.getElementById(\'ex_time_' + mission.id + '_' + task.id + '\').className=\'hidden\'" type="radio"  name="Exp_type_' + mission.id + '_' + task.id + '" value="minutes"')
    if(minutes_class==="visible"){html.push(' checked')}
    html.push('> Minutes')
    html.push('<input onclick="document.getElementById(\'ex_time_' + mission.id + '_' + task.id + '\').className=\'visible\';document.getElementById(\'ex_min_' + mission.id + '_' + task.id + '\').className=\'hidden\'" type="radio"  name="Exp_type_' + mission.id + '_' + task.id + '" value="time"')
    if(time_class==="visible"){html.push(' checked')}
    html.push('> Time')
    html.push('</div>')
    html.push('<div class="task">')
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
                console.log("=--->found a match", param, mission.parameters[param])
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
    if(task){
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


}


function replace_all(data, instructions){
    // returns data with keys in instruction replaced wiht values
    if(data){
      var new_data=data  
    }else{
      var new_data=""
    }

    for([key,value] of Object.entries(instructions)){
    	//console.log(key, value)
        new_data=new_data.split("|=" + key + "=|").join(value)
    }
    return new_data
}

function remove_param_tags(params){
    const x=[]
    if (params){
        for(const param of params){
            if(!x.includes(param.substr(2,param.length-4))){  // no need for duplicates in parameters

                x.push(param.substr(2,param.length-4))
            }
        }
    }
    return x
}
function get_mission(id){
    // mission ids are unique but they are within operations.  This function scans the operations to find the mission
    console.log(spy_data)
    for([key, operation] of Object.entries(spy_data)){
        for([mkey, mission] of Object.entries(operation.missions)){
            if(mkey===id){
                return mission
            }
        }
    }
    return null
}