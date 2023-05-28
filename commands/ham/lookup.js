const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const axios = require('axios').default;

function buildEmbed(data, location) {
    var address;

    if(data.po_box) {
        address = `PO Box ${data.po_box} \n ${data.city}, ${data.state} ${data.zip}`;
    } else {
        address = `${data.address} \n ${data.city}, ${data.state} ${data.zip}`;
    }
    
    var embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Callsign Lookup for ${data.callsign}`)
        .setURL(`https://hamcall.dev/${data.callsign}`)
        .addFields(
            { name: 'Name', value: data.name },
            { name: 'Address', value: address},
            { name: 'License Class', value: data.class},
            { name: 'Last LOTW Upload', value: data.last_lotw},
            { name: 'DMR ID', value: data.dmr_id[0].toString() },
            { name: 'Grid', value: location }
        )
    
    return embed;
}

function coordToGrid(loc) {
    if (!loc) {
        return 'Unknown';
    } else {
        // i was too lazy to write this myself
        // shoutout to paul brewer ki6cq and stephen houser n1sh
        // published under MIT license
        // find it here: https://gist.github.com/stephenhouser/4ad8c1878165fc7125cb547431a2bdaa

        var UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWX'
        var LOWERCASE = UPPERCASE.toLowerCase();
        var adjLat, adjLon, 
            fieldLat, fieldLon, 
            squareLat, squareLon, 
            subLat, subLon, 
            rLat, rLon;
    
        // Parameter Validataion
        var lat = parseFloat(loc.lat);
        if (isNaN(lat)) {
            throw "latitude is NaN";
        }
    
        if (Math.abs(lat) === 90.0) {
            throw "grid squares invalid at N/S poles";
        }
    
        if (Math.abs(lat) > 90) {
            throw "invalid latitude: " + lat;
        }
    
        var lon = parseFloat(loc.lon);
        if (isNaN(lon)) {
            throw "longitude is NaN";
        }
    
          if (Math.abs(lon) > 180) {
            throw "invalid longitude: " + lon;
        }
    
        // Latitude
        var adjLat = lat + 90;
        fieldLat = UPPERCASE[Math.trunc(adjLat / 10)];
        squareLat = '' + Math.trunc(adjLat % 10);
        rLat = (adjLat - Math.trunc(adjLat)) * 60;
        subLat = LOWERCASE[Math.trunc(rLat / 2.5)];
          
        // Logitude
          var adjLon = lon + 180;
          fieldLon = UPPERCASE[Math.trunc(adjLon / 20)];
          squareLon = ''+Math.trunc((adjLon / 2) % 10);
          rLon = (adjLon - 2*Math.trunc(adjLon / 2)) * 60;
        subLon = LOWERCASE[Math.trunc(rLon / 5)];
          
          return fieldLon + fieldLat + squareLon + squareLat + subLon + subLat;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Looks up a US callsign using hamcall')
        .addStringOption(option => 
            option.setName('callsign')
                .setDescription('Callsign to lookup')
                .setRequired(true)
                .setMaxLength(6)),
    async execute(interaction) {
        var callsign = interaction.options.getString('callsign');

        axios.get(`https://hamcall.dev/${callsign}.json`)
            .then(function (response) {
                var location = coordToGrid(response.data.location);

                interaction.reply({ embeds: [buildEmbed(response.data, location)] })
                console.log(response.data);
            })
            .catch(function (error) {
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    },
}