// config.js
export const config = {
  Player: {
    UI: {
      default: "https://www.youtube-nocookie.com/embed/",
      Invidious: {
        "NerdVPN": "https://invidious.nerdvpn.de/",
        "NerdVPN (Onion)": "http://nerdvpneaggggfdiurknszkbmhvjndks5z5k3g5yp4nhphflh3n3boad.onion/",
        "Nadeko (I2P)": "http://nadekoohummkxncchcsylr3eku36ze4waq4kdrhcqupckc3pe5qq.b32.i2p/",
        "Nadeko": "https://inv.nadeko.net/"
      },
      Piped: {
        "Piped": "https://piped.video/",
        "Frontendprivacy": "https://pipedapi.frontendfriendly.xyz/",
        "kavin.rocks": "https://pipedapi.kavin.rocks/"
      }
    },
    Misc: {
      sponsorBlock: {
        API: "https://sponsor.ajay.app/",
        //KEY: "",
        config: {
        Categories: {
        sponsor: "skip",            // Paid promotions
        selfpromo: "skip",          // "Check out my channel"
        interaction: "skip",        // "Like and subscribe"
        intro: "skip",              // Long intros
        outro: "skip",              // Outros/end screens
        preview: "skip",            // Preview recaps
        filler: "skip",             // Filler content
        //music_offtopic: "mute",     // Off-topic music
        poi_highlight: "none"       // Highlight only
        },
      AutoSkip: true,
      SkipThreshold: 0, // skip immediately
      ShowToast: false
        }
      },
      dearrow: {
        API: "https://dearrow.ajay.app/",
        KEY: "FR3Lo-e986a",
        config: {
        ReplaceTitles: true,
        ReplaceThumbnails: true,
        FallbackToOriginal: true,
        PreferOriginalIfNoVotes: true
        }
      }
    },
    Proxy: {
      CorsProxy: "https://corsproxy.io/?url=",
      AllOriginsRaw: "https://api.allorigins.win/raw?url=",
      AllOriginsJSON: "https://api.allorigins.win/get?url=",
      CorsProxy2: "https://corsproxy.cyou/?url="
    },
    APIs: {
      Indivious: {
        "Kavin.rocks API": "https://invidious.kavin.rocks/api/v1/"
        // May not use APIs
      },
      Piped: {
        // Not sure if I'm going to use APIs on this
      },
      Google: {
        API_KEY: ""
      } // Not used, may never be used, who knows.
    }
  }
};
