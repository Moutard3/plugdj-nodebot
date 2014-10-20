var PlugAPI = require('plugapi');
var logger = PlugAPI.getLogger('Bot');

var voteSkip=0,skippers="",dj=null,tmrCommands;
var ROOM = "";
var botname = "NodeBot";

/* === Login to Room === */
var bot = new PlugAPI({
    "email": "",
    "password": ""
});
bot.multiline = true;

bot.connect(ROOM);

/* === Events Handling === */
bot.on('roomJoin', function(room) {
    logger.info("Succefully joined "+room);
    bot.sendChat("Succefully started "+botname+". Type !commands for a list of commands");
});
bot.on('close', function(){bot.connect(ROOM);});
bot.on('error', function(){bot.connect(ROOM);});
bot.on('chat', function (msg) {
    if(msg.command != undefined) {
        command(msg.command, msg.args, msg.from.username, msg.from.id, msg.id, msg.from.role);
    }
});
bot.on('advance', function(dj) {
    voteSkip = 0;
    skippers = "";
    bot.woot();
});
bot.on('userLeave', function(usr) {
    if(skippers.indexOf(usr.id) != -1) {
        skippers.replace(" "+usr.id, "");
        voteSkip--;
    }
});

/* === Commands === */
function command(cmd,args,un,uid,cid, rank) {
    // ======================================== COMMANDS
    if (cmd.toLowerCase() === "commands" && tmrCommands === 0) {
        bot.sendChat("A full list of command is available here: https://github.com/Moutard3/plugdj-nodebot/blob/master/README.md#list-of-commands");
        tmrCommands = 1;
        setTimeout(function(){ tmrCommands = 0; }, 300000);
    }
    // ======================================== SKIP
    else if(cmd.toLowerCase() === "skip" && dj != null) {
        if(rank>1) {
            bot.moderateForceSkip();
        } else if(bot.getUsers().length>4) {
            if(skippers.indexOf(uid) === -1) {
                voteSkip++;
                skippers = skippers+" "+uid;
                bot.sendChat(getUser(uid).username+" voted to skip. ("+voteSkip+"/"+ceil(bot.getUsers().length/2)+").");
            }
            if(voteSkip>=ceil(bot.getUsers().length/2)) {
                bot.moderateForceSkip();
                bot.sendChat("Music skipped by vote.");
            }
        }
    }
    // ======================================== LINK
    else if(cmd.toLowerCase() === "link") {
        if(dj === uid || rank>0) {
            media = bot.getMedia();
            if(media.format === 1) {
                var linkToSong = "https://www.youtube.com/watch?v=" + media.cid;
                bot.sendChat("Current song link: "+linkToSong);
            }
            else if(media.format === 2) {
                SC.get('/tracks/' + media.cid, function (sound) {
                    bot.sendChat("Current song link: "+sound.permalink_url);
                });
            }
        }
    }
    // ======================================== BAN (username, time, reason)
    else if(cmd.toLowerCase() === "ban" && rank>2) {
        var time = -1;
        var reason = 1;
        if(typeof args[0] == "string" && checkForUser(args[0])) {
            if(args[1] !== undefined && typeof(args[1]) == "number") {
                var time = args[1];
            }
            if(args[2] !== undefined) {
                if(typeof(args[2]) == "number" && args[2]<6 && args[2]>0) {
                    var reason = args[2];
                }
                if(typeof(args[2]) == "string") {
                    r = args[2].toLowerCase();
                    if(r === "spam" || r === "troll") {
                        reason = 1;
                    } else if(r === "abuse" || r === "offensive") {
                        reason = 2;
                    } else if(r === "badsong") {
                        reason = 3
                    } else if(r === "badtheme") {
                        reason = 4;
                    } else if(r === "negative") {
                        reason = 5;
                    }
                }
            }
            bot.moderateBanUser(args[0], reason, time);
        }
    }
    // ======================================== RESTART
    else if(cmd.toLowerCase() === "restart" && rank>2) {
        bot.close();
        bot.connect(ROOM);
    }
}

// Check if user is in room by username
function checkForUser(u) {
    for (var key in bot.getUsers()) {
        if(bot.getUsers()[key].username.toLowerCase().indexOf(u.toLowerCase()) !== -1) {
            return true;
        }
    }
    return false;
}
// Get user info by username
function getUser(u) {
    for (var key in bot.getUsers()) {
        if(bot.getUsers()[key].username.toLowerCase().indexOf(u.toLowerCase()) !== -1) {
            return bot.getUsers()[key];
        }
    }
    return null;
}

