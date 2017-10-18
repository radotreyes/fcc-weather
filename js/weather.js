window.onload = function() {
  let location;

  /* get geolocation from browser API */
  navigator.geolocation.getCurrentPosition( p => {
    let url = 'https://fcc-weather-api.glitch.me/api/current?lon='
            + p.coords.longitude
            + '&lat='
            + p.coords.latitude;
    console.log( url ); // DEBUG

    /* AJAX request gets weather data from API endpoint */
    $.ajax( {
        dataType: 'json',
        url: url,
        timeout: 2000
      } )

      /* on successful request */
      .done( data => {
        let render = JSON.stringify( data );

        /* organize data into convenience variables */

        /* location name and relevant info */
        let uloc = data.name;
        $( '#locName' ).html( uloc );

        /* temperature and main data */
        let utempCur = data.main.temp;
        let utempRange = [ data.main.temp_min, data.main.temp_max ];
        $( '#temp' ).html(
          'Currently: ' + parseTemp( utempCur, false ) + ', '
          + '</br>H: ' + parseTemp( utempRange[1], false )
          + '</br>L: ' + parseTemp( utempRange[0], false )
        );

        let uhumidity = data.main.humidity;
        $( '#humidity' ).html( 'Humidity is ' + uhumidity + '%.' );

        let uclouds = data.clouds.all;
        $( '#clouds' ).append( parseClouds( uclouds ) );

        /* graphics and descriptions */
        let uweatherIcon = data.weather[0].icon;
        let uweatherDesc = data.weather[0].description;
        $( '#icon > img' ).attr( 'src', uweatherIcon )
        $( '#icon > img' ).attr( 'alt', uweatherDesc );
        $( '#icon > p' ).html( uweatherDesc );

        /* RAW DATA */
        $( '#rawData' ).append( render );

        /* time and date*/
        let udatetime = parseDateTime( data.dt );
        $( '#weekday' ).html( udatetime.weekday );
        $( '#month' ).html( udatetime.month );
        $( '#day' ).html( udatetime.day );
        $( '#year' ).html( udatetime.year );
        $( '#time' ).html( udatetime.time );

        /* render sunrise time */
        let usunrise = parseDateTime( data.sys.sunrise );
        $( '#sunrise' ).html( usunrise.time );

        /* render sunset time */
        let usunset = parseDateTime( data.sys.sunset );
        $( '#sunset' ).html( usunset.time );

        /* render wind data */
        let uwindVector = data.wind.hasOwnProperty( 'deg' );
        let uwind = parseWind( data.wind, uwindVector );
        if( uwindVector ) {
          $( '#winds' ).append( uwind.magnitude + ', ' + uwind.direction );
        }
        else {
          $( '#winds' ).append( uwind );
        }
      } )

      /* on fail */
      .fail( data => {
          /* display bad request */
          $( '#target' ).html( 'Bad request' );
      } )

      /* after request */
      .always();
    } );
}

function parseDateTime( rawDt ) {
  /* IN: raw date/time information nested within weather JSON
   * OUT: new object containing processed date/time data
   */
  dtStr = new Date( rawDt * 1000 ).toString();
  dt = dtStr.split( ' ' );
  return {
    'weekday': function() {
      let daysToReturn = {
         'Sun': 'Sunday',
         'Mon': 'Monday',
         'Tue': 'Tuesday',
         'Wed': 'Wednesday',
         'Thu': 'Thursday',
         'Fri': 'Friday',
         'Sat': 'Saturday'
       };
       return daysToReturn[dt[0]];
    },
    'month': function() {
      let monthsToReturn = {
         'Jan': 'January',
         'Feb': 'February',
         'Mar': 'March',
         'Apr': 'April',
         'May': 'May',
         'Jun': 'June',
         'Jul': 'July',
         'Aug': 'August',
         'Sep': 'September',
         'Oct': 'October',
         'Nov': 'November',
         'Dec': 'December',
       };
       return monthsToReturn[dt[1]];
    },
    'day': dt[2],
    'year': dt[3],
    'time': parseTime( dt[4], dt[6] )
  };
}

function parseTemp( rawTemp, celsius ) {
  /* IN: temperature in celsius
   * OUT: temperature in fahrenheit
   */
  return celsius ? rawTemp + '°C': Math.floor( rawTemp * 1.8 + 32 ) + '°F';
}

function parseTime( rawTime, rawDt ) {
  /* IN: time in seconds, measured from some reference point determined by API
   * OUT: time in HH:MM format
   */
  /* determine daylight savings time from API response */
  let dst = rawDt.replace( /[()]/g, '' ).split( '' )[1] == 'D' ? 11 : 12;

  /* split time into hours, minutes to get 12-hr format */
  let time = rawTime.split( ':' );
  if( parseInt( time[0] ) > 12 ) {
    var hours = parseInt( time[0] - dst );
    var ampm = 'PM';
  }
  else {
    var hours =  time[0];
    var ampm = parseInt( time[0] ) == 12 ? 'PM' : 'AM';
  }

  let minutes = time[1];

  /* return newly formatted time */
  return hours + ':' + minutes + ' ' + ampm;
}

function parseWind( rawWind, isVector = false ) {
  /* IN: raw wind information from weather JSON
   * OUT: wind magnitude, and if available, wind direction
   */
  if( !isVector ) { return Math.floor( rawWind.speed ) + ' mph'; }
  else {
    let angle = rawWind.deg
    let magnitude = Math.floor( rawWind.speed );
    let direction = '';
    if( ( angle >= 0 && angle < 22.5 ) || ( angle <= 360 && angle > 337.5 ) ) {
      direction = 'E';
    }
    else if( angle >= 22.5 && angle < 67.5 ) {
      direction = 'NE';
    }
    else if( angle >= 67.5 && angle < 112.5 ) {
      direction = 'N';
    }
    else if( angle >= 112.5 && angle < 157.5 ) {
      direction = 'NW';
    }
    else if( angle >= 157.5 && angle < 202.5 ) {
      direction = 'W';
    }
    else if( angle >= 202.5 && angle < 247.5 ) {
      direction = 'SW';
    }
    else if( angle >= 247.5 && angle < 292.5 ) {
      direction = 'S';
    }
    else if( angle >= 292.5 && angle <= 337.5 ) {
      direction = 'SE';
    }

    return { 'magnitude': magnitude + ' mph', 'direction': direction }
  }
}

function parseClouds( rawClouds ) {
  /* IN: integer representing cloudiness
   * OUT: string description of cloudiness
   */
  if( rawClouds >= 0 && rawClouds <= 20 ) { return 'Clear'; }
  else if( rawClouds > 20 && rawClouds <= 50 ) { return 'Partly Cloudy'; }
  else if( rawClouds > 50 && rawClouds <= 80 ) { return 'Cloudy'; }
  else if( rawClouds > 80 && rawClouds <= 100 ) { return 'Overcast'; }
  else { return 'N/A'; }
}
