var PlugAPI = require('plugapi');
var logger = PlugAPI.getLogger('Bot');

var voteSkip=0,skippers="",dj=null,tmrCommands=0;
var ROOM = "";
var botname = "NodeBot";
var crashonrestart = true; // Use it when your script automatically restart after crash, so the script reload when !restart is send.

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
bot.on('modBan', function(ban) {
    switch(ban.duration) {
        case 60:
            strTime = "an hour";
            break
        case 1440:
            strTime = "a day";
            break
        default:
            strTime = "permanent";
    }
    switch(ban.reason) {
        case 2:
            strReason = "offensive/abusive language";
            break
        case 3:
            strReason = "bad quality songs";
            break
        case 4:
            strReason = "bad theme songs";
            break
        case 5:
            strReason = "negative attitude";
            break
        default:
            strReason = "Spam/Troll";
    }
    bot.sendChat(ban.username+" has been banned "+strTime+" because of "+strReason+".");
});

/* === Commands === */
function command(cmd,args,un,uid,cid, rank) {
    var dj = bot.getDJ();
    // ======================================== BAN (username, time, reason)
    if(cmd.toLowerCase() === "ban" && rank>2) {
        var time = "f";
        var reason = 1;
        if(typeof args[0] === "string" && checkForUser(args[0])) {
            t = args[1];
            if(t != "f" && t != "d" && t != "h") {
                time = "f";
            } else {
                time = t;
            }
            
            if(typeof(args[2]) == "number" && args[2]<6 && args[2]>0) {
                var reason = args[2];
            } else if(typeof(args[2]) === "string") {
                r = args[2].toLowerCase();
                if(r === "abuse" || r === "offensive") {
                    reason = 2;
                } else if(r === "badsong") {
                    reason = 3
                } else if(r === "badtheme") {
                    reason = 4;
                } else if(r === "negative") {
                    reason = 5;
                } else {
                    reason = 1;
                }
            }
            
            bot.moderateBanUser(getUser(args[0]).id, reason, time);
        }
    }
    // ======================================== COMMANDS
    else if (cmd.toLowerCase() === "commands" && tmrCommands === 0) {
        bot.sendChat("A full list of command is available here: https://github.com/Moutard3/plugdj-nodebot/blob/master/README.md#list-of-commands");
        tmrCommands = 1;
        setTimeout(function(){ tmrCommands = 0; }, 300000);
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
    // ======================================== RESTART
    else if(cmd.toLowerCase() === "restart" && rank>2) {
        bot.close();
        bot.connect(ROOM);
            
        if(crashonrestart === true) {
            throw "Triggering restart";
        }
    }
    // ======================================== SKIP
    else if(cmd.toLowerCase() === "skip" && dj != null) {
        if(rank>1 || uid === dj.id) {
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
    // ======================================== UNBAN
    else if(cmd.toLowerCase() === "unban" && rank>2) {
        if(typeof args[0] === "string" && checkForBannedUser(args[0])) {
            bot.moderateUnbanUser(getBannedUser(args[0]).id);
        }
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
// Check if user is banned by username
function checkForBannedUser(u) {
    for (var key in API.getBannedUsers()) {
        if(API.getBannedUsers()[key].username.toLowerCase().indexOf(u.toLowerCase()) !== -1) {
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
// Get banned user info by username
function getBannedUser(u) {
    for (var key in API.getBannedUsers()) {
        if(API.getBannedUsers()[key].username.toLowerCase().indexOf(u.toLowerCase()) !== -1) {
            return API.getBannedUsers()[key];
        }
    }
    return null;
}

