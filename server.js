const http = require('http');
const server = http.createServer();
const url = require('url');
const querystring = require('querystring');
const hostname = 'localhost';
const port = 3000;
const fs = require('fs');
//Default store value, jused for /list endpoint
let store = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
//Listen to client's requets to server
server.on('request', (req, res) => {
    //Set content-type header
    res.writeHead(200, { "Content-Type": "application/json" });

    //Get request query params
    let query = querystring.parse(url.parse(req.url).query || "");

    //Get endpont route
    let path = url.parse(req.url).pathname || "";

    //Check for request method
    switch (req.method) {
        case 'GET':
            //Check GET request endpoint   
            if (path == '/list') {
                //Build our JSON response
                let json = JSON.stringify({ 
                    method: `${req.method}`,
                    path: path,
                    store: store
                });

                //Printout response
                res.end(json);
            }
            else if (path == '/get') {
                //Prepare our json response
                let json = JSON.stringify({ 
                    method: `${req.method}`,
                    path: path,
                    //Check if the provided request query paramater exist in our store array
                    //See { getObjByKey }
                    store: getObjByKey(query.mykey) || `No entries found in store with key ${query.mykey}`
                });
                //Printout our json response
                res.end(json);
            }  
            else {
                //GET request endpoint is not defined
                res.end(errorHandling(404, 'you can GET request the following paths /list and /get?mykey=key'));
            }
        break;    
        
        case 'POST':
            //Check the post request endpoint    
            if (path == '/add') {
                //Handle the case where POST request parameters doest not exist
                if (!query.mykey || !query.myvalue)
                {   
                    res.end(errorHandling(400, 'Invalid request, please pass the following paramaters "mykey", "myvalue". Example: /add?mykey=key&myvalue=value'));
                }
                else {
                    //Create a new object from the provided paramaters
                    let newObj = {
                        mykey: query.mykey || "",
                        myvalue: query.myvalue || ""
                    }
                    store.push(newObj);
                    fs.writeFileSync('./data.json', JSON.stringify(store), 'utf8');
                    //Prepare our json response
                    let json = JSON.stringify({ 
                        method: `${req.method}`,
                        path: path,
                        body: newObj,
                        store: store
                    });
                    //Printout json response
                    res.end(json);
                }

            } else {
                //The requested path is not defined
                res.end(errorHandling(400, 'you can add items to store through /add endpoint. Example: /add?mykey=new key& myvalue=new value'));
            }             
        break;
            
        case 'DELETE':
            if (path == '/remove') {
                //Check if object key provided in DELETE request paramater
                if (!query.mykey){   
                    res.end(errorHandling(400, "Invalid request, please pass the following paramaters \"mykey\", \"myvalue\". Example: /remove?mykey=key&myvalue=value"));
                } else {
                    //Check if object found with provided key
                    if (getObjByKey(query.mykey)) {
                        let body = getObjByKey(query.mykey);
                        //Get the index of the found object and delete the object from the array
                        store.splice(store.indexOf(getObjByKey(query.mykey)), 1);
                        //Save changes to the local file
                        fs.writeFileSync('./data.json', JSON.stringify(store), 'utf8');
                        //Prepare our json response
                        let json = JSON.stringify({ 
                            method: `${req.method}`,
                            path: path,
                            body: body,
                            store: store
                        });
                        //Printout json response
                        res.end(json);
                    } else {
                        //No objects found with provided key
                        res.end(errorHandling(404, `No entries found in store with key ${query.mykey}, hence cannot be removed`))
                    }
                }

            }

            else if (path == '/clear') {
                //Clear our store array
                store = [];
                fs.writeFileSync('./data.json', JSON.stringify(store), 'utf8');
                //Prepare our json response
                let json = JSON.stringify({ 
                    method: `${req.method}`,
                    path: path,
                    store: store
                });
                //Printout json response
                res.end(json);                
            }
            else {
                //DELETE request endpoint is not defined
                res.end(errorHandling(404, 'you can DELETE request the following paths /clear and /remove?mykey=key'));
            }
        break;    
            
        default:
            //The requested method is not defined yet, let's printout readbale error message.    
            res.end(errorHandling(404, `${req.method} is not defined`));
        break;    
    }
});


//Initiate server to listen the above defined hostname and port
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

//Return an object from array providing the key property
function getObjByKey(key) {
    let found = store.find((obj)=>{
        return obj.mykey == key;
    });
    return found;
};



//Called to render a json error message, accepts error code and message
function errorHandling(code, message) {
    let error = {
        error: code,
        message: message
    }
    return JSON.stringify(error);
}