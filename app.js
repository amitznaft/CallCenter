

const express = require('express');
const app = express();
var server = require('http').createServer(app);
const io = require("socket.io")(server);
const hostname = '127.0.0.1';
const port = 3000;


//------------ kafka------------
const kafka = require('./kafkaProduce');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//------------

//const consume = require('./consumer');

app.set('view engine', 'ejs');
app.use(express.static("public"));

app.get('/', (req,res)=>res.send('<a href=/send>Send</a> <br/> <a href=/view>View</a> <br/> <a href=/predict>Predict</a>'))
app.get('/send', (req,res)=>res.render('sender'));
app.get('/view', (req,res)=>res.render('viewer'));
app.get('/predict', (req, res) => res.render('predict'));



//------------ Socket.io ----------------
io.on("connection", (socket) => {
    console.log("new user connected");
    socket.on("totalWaitingCalls", (msg) => { console.log(msg.to)});
   // socket.on("callDetails", (msg) => { console.log(msg) ;consume(JSON.stringify(msg)) });
    socket.on("callDetails", (msg) => { console.log(msg) ;kafka.publish(msg); });
    socket.on("MsgBigMl", (msg) => {
        city = msg.city;
        sit = msg.Situation;
        lang = msg.language;
        gender = msg.gender;
        age = msg.age;
        predict = predictTopic(age, city, gender, lang, sit);
        //console.log(predict);
        socket.emit('predict', predict);
    });
});


server.listen(port, () => console.log(`app listening at http://localhost:${port}`));

//connect to mongodb.com , redislabs , and kafka consumer
const {MongoClient} = require('mongodb');
 
const uri = "your_uri";
const client = new MongoClient(uri);

// Connect to the MongoDB cluster
client.connect();
console.log(`Connected to mongoDB`);
//redis 
var redis = require('redis');
const { Client } = require('node-rdkafka');
var client2 = redis.createClient(port, endPoint, {no_ready_check: true});
client2.auth(password, function (err) {
    if (err) {throw err;}
});

client2.on('error', function (err) {
    console.log('Error ' + err);
}); 

client2.on('connect', function() {
    console.log('Connected to Redis');
});

//set expire time of store data in redis to midnight 
var nd = new Date().setHours(23,59,59);
var expire = Math.floor((nd-Date.now())/1000);

var Kafka = require("node-rdkafka");
const { json } = require('body-parser');
const { Consumer } = require('kafka-node');

//your cloudkarfka configuratin
const kafkaConf = {
    "group.id": "cloudkarafka-example",
    "metadata.broker.list": "your_list".split(","),
    "socket.keepalive.enable": true,
    "security.protocol": "SASL_SSL",
    "sasl.mechanisms": "SCRAM-SHA-256",
    "sasl.username": "userName",
    "sasl.password": "password",
    "debug": "generic,broker,security"
  };
  
  const prefix = "username-";
  const topic = `${prefix}test`;
  const consumer = new Kafka.KafkaConsumer(kafkaConf);
  consumer.connect();
  consumer.on("error", function(err) {
   console.error(err);
   });
  consumer.on("ready", function(arg) {
   console.log(`Consumer kafka ready`);
   consumer.subscribe([topic]);
   consumer.consume();
   });

  consumer.on("data", function(m) {
    const result = client.db("CallCenter").collection("calls").insertOne(JSON.parse(m.value.toString()));
    client2.set(JSON.parse(m.value.toString()).id , m.value.toString() ,'EX' , expire);
    var d  = new Date().toISOString();
    var res = d.substring(11,19);
    io.emit('toclient' , JSON.parse(m.value.toString()).totalCalls , res);
    io.emit('toclient6' , JSON.parse(m.value.toString()).date, res);   
    NumberOfCalls();
  });

   //call function if cloudkarfka consumer delay 
   function consume(m){
    
    const result = client.db("CallCenter").collection("calls").insertOne(JSON.parse(m.toString()));
    client2.set(JSON.parse(m.toString()).id , m.toString() ,'EX' , expire);
    var d  = new Date().toISOString();
    var res = d.substring(11,19);
    io.emit('toclient' , JSON.parse(m.toString()).totalCalls , res);
    io.emit('toclient6' , JSON.parse(m.toString()).date, res);
    NumberOfCalls();
   }

   // this function extract all keys and update the viewer , with socket 
   function NumberOfCalls(){
   var city = [0,0,0,0,0,0,0];// ירושלים,נהריה,חיפה,תל אביב,אשדוד,אשקלון,באר שבע
   var topic = [0,0,0,0,0,0,0];   
   var language = [0,0,0,0,0,0];//hebrew,english,amharic,russian,arabic,thai
   client2.keys('*', function (err, keys) {
        if (err) return console.log(err);
        for (var i = 0, len = keys.length; i < len; i++) {
            
            client2.get(keys[i], function (err, reply) {
            if (err) { throw err;}
           
            var currentCity = JSON.parse(reply.toString()).city;
            var currentTopic = JSON.parse(reply.toString()).topic;
            var currentlanguage = JSON.parse(reply.toString()).language;

            if(currentlanguage == "hebrew"){
                language[0]++;
                io.emit('toclient4' , language );
             }
             if(currentlanguage == "english"){
                 language[1]++;
                 io.emit('toclient4' , language );
              }
              if(currentlanguage == "amharic"){
                 language[2]++;
                 io.emit('toclient4' , language );
              }
              if(currentlanguage == "russian"){
                 language[3]++;
                 io.emit('toclient4' , language );
              }
              if(currentlanguage == "arabic"){
                  language[4]++;
                  io.emit('toclient4' , language );
               }
               if(currentlanguage == "thai"){
                  language[5]++;
                  io.emit('toclient4' , language );
               }

            //topic
            if(currentTopic == "Medical"){
                topic[0]++;
                io.emit('toclient3' , topic );
             }
             if(currentTopic == "drugs"){
                 topic[1]++;
                 io.emit('toclient3' , topic );
              }
              if(currentTopic == "food"){
                 topic[2]++;
                 io.emit('toclient3' , topic );
              }
              if(currentTopic == "water"){
                 topic[3]++;
                 io.emit('toclient3' , topic );
              }
              if(currentTopic == "shelter"){
                  topic[4]++;
                  io.emit('toclient3' , topic );
               }
               if(currentTopic == "information"){
                  topic[5]++;
                  io.emit('toclient3' , topic );
               }
               if(currentTopic == "evacuation"){
                 topic[6]++;
                 io.emit('toclient3' , topic);
              }
            
            //currentCity
            if(currentCity == "jerusalem"){
               city[0]++;
               io.emit('toclient2' , city );
            }
            if(currentCity == "naaria"){
                city[1]++;
                io.emit('toclient2' , city );
             }
             if(currentCity == "haifa"){
                city[2]++;
                io.emit('toclient2' , city );
             }
             if(currentCity == "telAviv"){
                city[3]++;
                io.emit('toclient2' , city );
             }
             if(currentCity == "ashdod"){
                 city[4]++;
                 io.emit('toclient2' , city );
              }
              if(currentCity == "Ashkelon"){
                 city[5]++;
                 io.emit('toclient2' , city );
              }
              if(currentCity == "beerSheva"){
                city[6]++;
                io.emit('toclient2' , city );
             }
        });
        }
      });
   }

//  function time(){

//     var max = 0 ;
//     var totalTime = 0;
//     var d  = new Date().toISOString();
//     var res = d.substring(11,19);
//     client2.keys('*', function (err, keys) {
//         if (err) return console.log(err);
//         for (var i = 0, len = keys.length; i < len; i++) {
            
//             client2.get(keys[i], function (err, reply) {
//             if (err) { throw err;}
            
//             var callHolds = JSON.parse(reply.toString()).totalCalls;
//             totalTime += JSON.parse(reply.toString()).totalTime

//             io.emit('toclient7' , callHolds , res);

//             // if(max < callHolds){
                
//             //     max = callHolds;
//             // }
            
//         });
//     }
//   });   
//  }



//BigML
 function predictTopic(age, city, gender, language, optionvalue) {
    if (age == null) {
        return "Medical";
    } else if (age > 34) {
        if (gender == null) {
            return "Medical";
        } else if (gender == "male") {
            if (optionvalue == null) {
                return "Medical";
            } else if (optionvalue == "relaxation") {
                if (language == null) {
                    return "water";
                } else if (language == "amharic") {
                    return "information";
                } else if (language != "amharic") {
                    if (language == "hebrew") {
                        return "Medical";
                    } else if (language != "hebrew") {
                        return "water";
                    }
                }
            } else if (optionvalue != "relaxation") {
                if (city == null) {
                    return "Medical";
                } else if (city == "jerusalem") {
                    if (age > 72) {
                        if (language == null) {
                            return "water";
                        } else if (language == "hebrew") {
                            return "food";
                        } else if (language != "hebrew") {
                            return "water";
                        }
                    } else if (age <= 72) {
                        if (language == null) {
                            return "Medical";
                        } else if (language == "russian") {
                            return "food";
                        } else if (language != "russian") {
                            if (optionvalue == "Emergency routine") {
                                return "Medical";
                            } else if (optionvalue != "Emergency routine") {
                                if (age > 52) {
                                    if (age > 57) {
                                        return "Medical";
                                    } else if (age <= 57) {
                                        return "water";
                                    }
                                } else if (age <= 52) {
                                    return "Medical";
                                }
                            }
                        }
                    }
                } else if (city != "jerusalem") {
                    if (age > 57) {
                        return "Medical";
                    } else if (age <= 57) {
                        if (age > 45) {
                            if (optionvalue == "Emergency routine") {
                                return "information";
                            } else if (optionvalue != "Emergency routine") {
                                return "food";
                            }
                        } else if (age <= 45) {
                            if (optionvalue == "Emergency routine") {
                                return "food";
                            } else if (optionvalue != "Emergency routine") {
                                return "Medical";
                            }
                        }
                    }
                }
            }
        } else if (gender == "female") {
            if (age > 52) {
                if (age > 71) {
                    if (language == null) {
                        return "evacuation";
                    } else if (language == "hebrew") {
                        return "shelter";
                    } else if (language != "hebrew") {
                        return "evacuation";
                    }
                } else if (age <= 71) {
                    if (city == null) {
                        return "Medical";
                    } else if (city == "telAviv") {
                        return "evacuation";
                    } else if (city != "telAviv") {
                        return "Medical";
                    }
                }
            } else if (age <= 52) {
                if (language == null) {
                    return "food";
                } else if (language == "amharic") {
                    return "water";
                } else if (language != "amharic") {
                    if (age > 41) {
                        if (optionvalue == null) {
                            return "Medical";
                        } else if (optionvalue == "Emergency routine") {
                            return "food";
                        } else if (optionvalue != "Emergency routine") {
                            return "Medical";
                        }
                    } else if (age <= 41) {
                        if (language == "hebrew") {
                            return "food";
                        } else if (language != "hebrew") {
                            return "food";
                        }
                    }
                }
            }
        }
    } else if (age <= 34) {
        if (language == null) {
            return "Medical";
        } else if (language == "english") {
            if (city == null) {
                return "Medical";
            } else if (city == "jerusalem") {
                return "Medical";
            } else if (city != "jerusalem") {
                if (age > 19) {
                    if (optionvalue == null) {
                        return "Medical";
                    } else if (optionvalue == "Emergency routine") {
                        return "Medical";
                    } else if (optionvalue != "Emergency routine") {
                        return "Medical";
                    }
                } else if (age <= 19) {
                    if (gender == null) {
                        return "food";
                    } else if (gender == "male") {
                        return "food";
                    } else if (gender == "female") {
                        return "food";
                    }
                }
            }
        } else if (language != "english") {
            if (language == "amharic") {
                if (gender == null) {
                    return "Medical";
                } else if (gender == "male") {
                    if (city == null) {
                        return "Medical";
                    } else if (city == "jerusalem") {
                        if (optionvalue == null) {
                            return "evacuation";
                        } else if (optionvalue == "relaxation") {
                            return "Medical";
                        } else if (optionvalue != "relaxation") {
                            if (optionvalue == "Emergency routine") {
                                return "evacuation";
                            } else if (optionvalue != "Emergency routine") {
                                return "evacuation";
                            }
                        }
                    } else if (city != "jerusalem") {
                        return "Medical";
                    }
                } else if (gender == "female") {
                    return "Medical";
                }
            } else if (language != "amharic") {
                if (city == null) {
                    return "Medical";
                } else if (city == "telAviv") {
                    if (gender == null) {
                        return "Medical";
                    } else if (gender == "male") {
                        return "Medical";
                    } else if (gender == "female") {
                        if (optionvalue == null) {
                            return "Medical";
                        } else if (optionvalue == "Emergency routine") {
                            return "Medical";
                        } else if (optionvalue != "Emergency routine") {
                            return "drugs";
                        }
                    }
                } else if (city != "telAviv") {
                    if (language == "hebrew") {
                        if (city == "haifa") {
                            if (optionvalue == null) {
                                return "Medical";
                            } else if (optionvalue == "Emergency routine") {
                                return "drugs";
                            } else if (optionvalue != "Emergency routine") {
                                return "Medical";
                            }
                        } else if (city != "haifa") {
                            if (age > 23) {
                                if (optionvalue == null) {
                                    return "Medical";
                                } else if (optionvalue == "relaxation") {
                                    if (age > 28) {
                                        if (age > 31) {
                                            return "Medical";
                                        } else if (age <= 31) {
                                            return "water";
                                        }
                                    } else if (age <= 28) {
                                        if (city == "jerusalem") {
                                            if (age > 26) {
                                                return "evacuation";
                                            } else if (age <= 26) {
                                                return "Medical";
                                            }
                                        } else if (city != "jerusalem") {
                                            return "Medical";
                                        }
                                    }
                                } else if (optionvalue != "relaxation") {
                                    if (city == "Ashkelon") {
                                        return "information";
                                    } else if (city != "Ashkelon") {
                                        return "Medical";
                                    }
                                }
                            } else if (age <= 23) {
                                if (age > 19) {
                                    if (optionvalue == null) {
                                        return "Medical";
                                    } else if (optionvalue == "Emergency routine") {
                                        if (age > 21) {
                                            return "water";
                                        } else if (age <= 21) {
                                            return "Medical";
                                        }
                                    } else if (optionvalue != "Emergency routine") {
                                        if (age > 21) {
                                            return "Medical";
                                        } else if (age <= 21) {
                                            if (gender == null) {
                                                return "drugs";
                                            } else if (gender == "male") {
                                                return "drugs";
                                            } else if (gender == "female") {
                                                return "drugs";
                                            }
                                        }
                                    }
                                } else if (age <= 19) {
                                    if (city == "naaria") {
                                        return "shelter";
                                    } else if (city != "naaria") {
                                        if (city == "ashdod") {
                                            if (gender == null) {
                                                return "Medical";
                                            } else if (gender == "male") {
                                                if (optionvalue == null) {
                                                    return "Medical";
                                                } else if (optionvalue == "Emergency") {
                                                    return "Medical";
                                                } else if (optionvalue != "Emergency") {
                                                    return "drugs";
                                                }
                                            } else if (gender == "female") {
                                                return "shelter";
                                            }
                                        } else if (city != "ashdod") {
                                            if (age > 18) {
                                                return "information";
                                            } else if (age <= 18) {
                                                if (optionvalue == null) {
                                                    return "Medical";
                                                } else if (optionvalue == "Emergency routine") {
                                                    if (city == "Ashkelon") {
                                                        if (gender == null) {
                                                            return "Medical";
                                                        } else if (gender == "male") {
                                                            return "drugs";
                                                        } else if (gender == "female") {
                                                            return "Medical";
                                                        }
                                                    } else if (city != "Ashkelon") {
                                                        if (gender == null) {
                                                            return "Medical";
                                                        } else if (gender == "male") {
                                                            if (city == "jerusalem") {
                                                                return "Medical";
                                                            } else if (city != "jerusalem") {
                                                                return "Medical";
                                                            }
                                                        } else if (gender == "female") {
                                                            if (city == "jerusalem") {
                                                                return "Medical";
                                                            } else if (city != "jerusalem") {
                                                                return "Medical";
                                                            }
                                                        }
                                                    }
                                                } else if (optionvalue != "Emergency routine") {
                                                    if (gender == null) {
                                                        return "Medical";
                                                    } else if (gender == "male") {
                                                        if (city == "beerSheva") {
                                                            return "Medical";
                                                        } else if (city != "beerSheva") {
                                                            if (optionvalue == "Emergency") {
                                                                return "Medical";
                                                            } else if (optionvalue != "Emergency") {
                                                                if (city == "jerusalem") {
                                                                    return "Medical";
                                                                } else if (city != "jerusalem") {
                                                                    return "Medical";
                                                                }
                                                            }
                                                        }
                                                    } else if (gender == "female") {
                                                        if (city == "beerSheva") {
                                                            return "evacuation";
                                                        } else if (city != "beerSheva") {
                                                            if (city == "jerusalem") {
                                                                if (optionvalue == "Emergency") {
                                                                    return "Medical";
                                                                } else if (optionvalue != "Emergency") {
                                                                    return "Medical";
                                                                }
                                                            } else if (city != "jerusalem") {
                                                                return "Medical";
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else if (language != "hebrew") {
                        if (age > 29) {
                            return "shelter";
                        } else if (age <= 29) {
                            if (gender == null) {
                                return "Medical";
                            } else if (gender == "male") {
                                if (optionvalue == null) {
                                    return "Medical";
                                } else if (optionvalue == "Emergency routine") {
                                    if (age > 18) {
                                        return "Medical";
                                    } else if (age <= 18) {
                                        return "Medical";
                                    }
                                } else if (optionvalue != "Emergency routine") {
                                    return "Medical";
                                }
                            } else if (gender == "female") {
                                if (optionvalue == null) {
                                    return "Medical";
                                } else if (optionvalue == "Emergency") {
                                    if (language == "russian") {
                                        return "information";
                                    } else if (language != "russian") {
                                        return "water";
                                    }
                                } else if (optionvalue != "Emergency") {
                                    return "Medical";
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}



