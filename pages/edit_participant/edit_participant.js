let key=null
const activities=["Reenactor","Artisan","Vendor","Volunteer"]


async function start_me_up(){
    params=get_params()
    key=params.key
    data = await get_data()
    console.log(data)
    html=[]
    html.push("<h1>Edit Participant Data</h1>")
    html.push('<div class="data-container">')
    html.push(place_data("first_name"))
    html.push(place_data("last_name"))
    html.push(place_data("activity",{type:"multi-select",object:activities}))
    html.push(place_data("activity_description",{label:"Tell us about what you do:",type:"multi-line"}))
    html.push(place_data("city"))
    html.push(place_data("state",{size:2}))
    html.push(place_data("zip",{size:5}))
    html.push(place_data("email",{size:30}))
    html.push(place_data("home_phone"))
    html.push(place_data("mobile_phone"))
    html.push(place_data("past_participant",{type:"boolean"}))
    html.push(place_data("years_attended",{type:"integer", size:4}))
    html.push(place_data("participating_adults",{type:"integer", size:4}))
    html.push(place_data("participating_children",{type:"integer", size:4}))
    html.push(place_data("arrival_date"))
    html.push('</div><div id="error-message"></div>')

    document.body.innerHTML=html.join("")
    

}
function place_data(field,params){
    if(!params){params={}}
    if(params.type){
        type=params.type
    }else{
        type='text'
    }

    const html=[]
    if(params.label){
        label = params.label
    }else{
        label=toTitleCase(field.split("_").join(" "))
    }

    html.push('<div class="data-row"><div data-label="'+label+'" ')
    if(type==='text'||type==='integer'){
        html.push('data-class="data-label" class="data-label" id="' + field + '_label">'+label+"</div>")
        html.push('<div class="data-field"><input ')
        if(data.fields[field]!==undefined){
            html.push(' value="'+data.fields[field]+'"')
        }        
        if(params.size){
            html.push(' size="'+params.size+'"')
        }        
        if(type!=='text'){
            html.push(' data-validation="' + type + '"')
            html.push(' style="text-align:right"')
        }        
        html.push(' type=text id="'+field+'" onchange="change(this)" /></div>')
    }else if(type==='multi-line'){
        html.push('data-class="memo-label" class="memo-label" id="' + field + '_label">'+label+"</div>")
        html.push('<div class="memo-field"><textarea class="memo" rows=5 id="'+field+'" onchange="change(this)">')
        if(data.fields[field]){
            html.push(data.fields[field])
        }        
        html.push('</textarea></div>')
    }else if(type==='multi-select'){
        html.push('data-class="data-label" class="data-label" id="' + field + '_label">'+label+"</div>")
        html.push('<div class="data-field">')
        for(const entry of params.object){
            html.push('<input ')
            if(data.fields[field].includes(entry)){
                html.push('checked ')
            }
            html.push('type="checkbox" id="'+field+'" onchange="change(this)" value="'+entry+'"/> '+entry+'<br>')
        }
        html.push('</div>')
    }else if(type==='boolean'){
        html.push('data-class="data-label" class="data-label" id="' + field + '_label">'+label+"</div>")
        html.push('<div class="data-field">')
        html.push('<input ')
        if(data.fields[field]){
            html.push('checked ')
        }
        html.push('type="radio" name="'+field+'" id="'+field+'|yes" onchange="change(this)" value="true"/>Yes<br>')
        html.push('<input ')
        if(!data.fields[field]){
            html.push('checked ')
        }
        html.push('type="radio" name="'+field+'" id="'+field+'|no" onchange="change(this)" value="true"/>No')
    
        html.push('</div>')
    }
    html.push("</div>")
    console.log(html.join(""))
    return html.join("")
}

function populate(name){
    document.getElementById(name).value=data.fields[name]
}

async function change(tag){
  
  const payload={key:key,mode:"keyed update", column:tag.id} 
  
  if(tag.type==="radio"){
    console.log (tag.id,tag.name.substr(tag.name.length - 4))  
      payload.column=tag.name
      payload.value=tag.id.slice(-4) === "|yes"
  }else if(tag.type==="checkbox"){
    payload.value=[]
    for(child of tag.parentElement.children){
      if(child.type && child.type==="checkbox" && child.checked){
        payload.value.push(child.value)
      }
    }
  }else{
      if(tag.getAttribute("data-validation")){
          if(tag.getAttribute("data-validation")==="integer"){
              console.log("-----------------at integer")
              if(!Number.isInteger(parseInt(tag.value))){
                  // data validation failed
                  show_message(payload.column, "Integer Required", "failure", 2000)
                  return
              }
            payload.value=parseInt(tag.value)
          }else if(tag.getAttribute("data-validation")==="decimal"){
            payload.value=parseFloat(tag.value)
          }else{
            // should not get here   
            payload.value=tag.value          
          }
      }else{
        payload.value=tag.value    
      }
  }
  console.log(JSON.stringify(payload))
  
  // update the interface while editing is happening
  show_message(payload.column,"updating", "updating")

  const response = await fetch(gas_url, {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'omit', // include, *same-origin, omit
      headers: {
          'Content-Type': 'text/plain;charset=utf-8',
      }
  })
  const reply = JSON.parse(await response.text())
  if(reply.error){
      // update failed
      show_message(payload.column, "failed", "failure")
      console.log(reply.error.type)
      console.log(reply.error.message)
      document.getElementById("error-message").innerHTML=reply.error.message

  }else if(reply.message && reply.message==="success"){
    // updated succeded
    show_message(payload.column, "success", "success",1000)
  }else{
    // unexpected
    show_message(payload.column, "unexpected", "failure")
    console.log(reply)
}

}

function show_message(field, message, class_name, clear_milliseconds){
    if(clear_milliseconds){
        setTimeout(function() {clear_message(field)}, 1000);
    }
    const label_div=document.getElementById(field + '_label')
    label_div.className = label_div.className + " " + class_name
    label_div.innerHTML=message
}
function clear_message(field){
    const label_div=document.getElementById(field + '_label')
    label_div.innerHTML=label_div.getAttribute("data-label")
    label_div.className = label_div.getAttribute("data-class")
}

async function get_data(){
    const payload={key:key,mode:"data"} 
    response = await fetch(gas_url, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    })
    
    const response_load = await response.text()
    return JSON.parse (response_load)

}

function get_params() {// get the querystring parameters
    qs = document.location.search.split('+').join(' ');
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
}

function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }