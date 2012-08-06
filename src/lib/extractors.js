// Extractors

var skin = chrome.extension.getURL('skin/');
var Extractors = new Repository();
Extractors.register([
  {
    name : 'LDR',
    getItem : function(ctx, getOnly){
      if(ctx.host !== 'reader.livedoor.com' && ctx.host !== 'fastladder.com')
        return null;
      var item = $X('ancestor-or-self::div[starts-with(@id, "item_count")]', ctx.target)[0];
      if(!item)
        return null;
      var channel = $X('id("right_body")/div[@class="channel"]//a', ctx.document)[0];

      var res = {
        author : ($X('descendant-or-self::div[@class="author"]/text()', item)[0] || '').extract(/by (.*)/),
        title  : $X('descendant-or-self::div[@class="item_header"]//a/text()', item)[0] || '',
        feed   : channel.textContent,
        href   : $X('(descendant-or-self::div[@class="item_info"]/a)[1]/@href', item)[0].replace(/[?&;](fr?(om)?|track|ref|FM)=(r(ss(all)?|df)|atom)([&;].*)?/,'') || channel.href
      };
      var uri = createURI(res.href);
      if(!getOnly){
        ctx.title = res.feed + (res.title? ' - ' + res.title : '');
        ctx.href  = res.href;
        ctx.host  = uri.host;
      }
      return res;
    }
  },

  {
    name : 'Quote - LDR',
    ICON : 'http://reader.livedoor.com/favicon.ico',
    check: function(ctx){
      return Extractors.LDR.getItem(ctx, true) && ctx.selection;
    },
    extract: function(ctx){
      Extractors.LDR.getItem(ctx);
      return Extractors.Quote.extract(ctx);
    }
  },

  {
    name: 'ReBlog - LDR',
    ICON: 'http://reader.livedoor.com/favicon.ico',
    check: function(ctx){
      var item = Extractors.LDR.getItem(ctx, true);
      return item && (
        item.href.match(/^http:\/\/.*?\.tumblr\.com\//) ||
        (ctx.onImage && ctx.target.src.match(/^http:\/\/data\.tumblr\.com\//)));
    },
    extract: function(ctx){
      Extractors.LDR.getItem(ctx);
      return Extractors.ReBlog.extractByLink(ctx, ctx.href);
    }
  },

  {
    name: 'Photo - LDR',
    ICON: 'http://reader.livedoor.com/favicon.ico',
    check: function(ctx){
      return Extractors.LDR.getItem(ctx, true) && ctx.onImage;
    },
    extract: function(ctx){
      Extractors.LDR.getItem(ctx);
      return Extractors.check(ctx)[0].extract(ctx);
    }
  },

  {
    name: 'Link - LDR',
    ICON: 'http://reader.livedoor.com/favicon.ico',
    check: function(ctx){
      return Extractors.LDR.getItem(ctx, true);
    },
    extract: function(ctx){
      Extractors.LDR.getItem(ctx);
      return Extractors.Link.extract(ctx);
    }
  },

  {
    name: 'GoogleReader',
    getItem: function(ctx, getOnly){
      if(!ctx.href.match(/\/\/www\.google\.[^\/]+\/reader\//))
        return null;
      var item = $X('ancestor-or-self::div[contains(concat(" ",@class," ")," entry ")]', ctx.target)[0];
      if(!item)
        return null;
      var res = {
        author: ($X('descendant::div[@class="entry-author"]/*[@class="entry-author-name"]/text()', item)[0] || ''),
        title : $X('descendant::a[@class="entry-title-link"]/text()', item)[0] || '',
        feed  : ($X('descendant::a[@class="entry-source-title"]/text()', item)[0] || $X('id("chrome-stream-title")//a/text()', ctx.document)[0]),
        href  : $X('descendant::a[@class="entry-title-link"]/@href', item)[0].replace(/[?&;](fr?(om)?|track|ref|FM)=(r(ss(all)?|df)|atom)([&;].*)?/,'')
      };
      if(!getOnly){
        ctx.title = res.feed + (res.title? ' - ' + res.title : '');
        ctx.href  = res.href;
        ctx.host  = res.href.match(/http:\/\/(.*?)/)[1];
      }
      return res;
    }
  },

  {
    name: 'Quote - GoogleReader',
    ICON: 'http://www.google.com/reader/ui/favicon.ico',
    check: function(ctx){
      return Extractors.GoogleReader.getItem(ctx, true) && ctx.selection;
    },
    extract: function(ctx){
      Extractors.GoogleReader.getItem(ctx);
      return Extractors.Quote.extract(ctx);
    }
  },

  {
    name: 'ReBlog - GoogleReader',
    ICON: 'http://www.google.com/reader/ui/favicon.ico',
    check: function(ctx){
      var item = Extractors.GoogleReader.getItem(ctx, true);
      return item && (
        item.href.match(/^http:\/\/.*?\.tumblr\.com\//) ||
        (ctx.onImage && ctx.target.src.match(/^http:\/\/data\.tumblr\.com\//)));
    },
    extract: function(ctx){
      Extractors.GoogleReader.getItem(ctx);
      return Extractors.ReBlog.extractByLink(ctx, ctx.href);
    }
  },

  {
    name: 'Photo - GoogleReader',
    ICON: 'http://www.google.com/reader/ui/favicon.ico',
    check: function(ctx){
      return Extractors.GoogleReader.getItem(ctx, true) && ctx.onImage;
    },
    extract: function(ctx){
      Extractors.GoogleReader.getItem(ctx);
      return Extractors.check(ctx)[0].extract(ctx);
    }
  },

  {
    name: 'Link - GoogleReader',
    ICON: 'http://www.google.com/reader/ui/favicon.ico',
    check: function(ctx){
      return Extractors.GoogleReader.getItem(ctx, true);
    },
    extract: function(ctx){
      Extractors.GoogleReader.getItem(ctx);
      return Extractors.Link.extract(ctx);
    }
  },

  {
    name: 'ReBlog - Clipp',
    ICON: 'http://clipp.in/favicon.ico',
    CLIPP_URL: 'http://clipp.in/',
    check: function(ctx) {
      return this.getLink(ctx);
    },
    extract: function(ctx) {
      var link = this.getLink(ctx);
      if (!link) {
        return {};
      }

      var that = this;
      var endpoint = this.CLIPP_URL + 'bookmarklet' + link;
      return this.getForm(endpoint).addCallback(function(form) {
        return update({
          type: 'link',
          item: ctx.title,
          itemUrl: ctx.href,
          favorite: {
            name: 'Clipp',
            endpoint: endpoint,
            form: form
          }
        }, that.convertToParams(form));
      });
    },
    getForm: function(url, ignoreError) {
      return request(url).addCallback(function(res) {
        var doc = createHTML(res.responseText);
        var form = $X('//form', doc)[0];
        return formContents(form);
      });
    },
    checkEntryPage: function(ctx) {
      return /clipp.in\/entry\/\d+/.test(ctx.href);
    },
    getLink: function(ctx) {
      return this.checkEntryPage(ctx) ? this.getLinkByPage(ctx.document) : this.getLinkByTarget(ctx);
    },
    getLinkByPage: function(doc) {
      return $X('//a[contains(@href, "add?reblog=")]/@href', doc)[0];
    },
    getLinkByTarget: function(ctx) {
      return $X('./ancestor-or-self::div[contains(concat(" ", @class, " "), " item ")]//a[contains(@href, "add?reblog=")]/@href', ctx.target)[0];
    },
    convertToParams: function(form) {
      if (form.embed_code) {
        return {
          type: 'video',
          item: form.title,
          itemUrl: form.address,
          body: form.embed_code
        };
      } else if (form.image_address) {
        return {
          type: 'photo',
          item: form.title,
          itemUrl: form.image_address
        };
      } else if (form.quote && form.quote !== '<br>') {
        return {
          type: 'quote',
          item: form.title,
          itemUrl: form.address,
          body: form.quote
        };
      }
      return {
        type: 'link',
        item: form.title,
        itemUrl: form.address
      };
    }
  },

  {
    name: 'Quote - Twitter',
    ICON: 'http://twitter.com/favicon.ico',
    check: function(ctx){
      return ctx.href.match(/\/\/twitter\.com\/.*?\/(?:status|statuses)\/\d+/);
    },
    extract: function(ctx){
      var res = {
        type     : 'quote',
        item     : ctx.title.substring(0, ctx.title.indexOf(': ')),
        itemUrl  : ctx.href,
        favorite : {
          name : 'Twitter',
          id   : ctx.href.match(/(status|statuses)\/(\d+)/)[2]
        }
      }
      if(ctx.selection){
        res.body = ctx.selection.raw;
        res.flavors = {
          html : ctx.selection.html
        };
      } else {
        var elm = ctx.document.querySelector('.tweet-text');
        var cloneElm = elm.cloneNode(true);
        $A(cloneElm.getElementsByClassName('tco-ellipsis')).forEach(
          function(target){
            target.parentNode.removeChild(target);
          }
        );
        var sel = createFlavoredString(cloneElm);
        res.body = sel.raw;
        res.flavors = {
          html : sel.html
        };
      }
      return res;
    }
  },

  {
    name : 'Quote - inyo.jp',
    ICON : skin+'quote.png',
    check: function(ctx){
      return ctx.href.match(/\/\/inyo\.jp\/quote\/[a-f\d]+/);
    },
    extract: function(ctx){
      var res = {
        type     : 'quote',
        item     : $X('//span[@class="title"]/text()')[0],
        itemUrl  : ctx.href
      };
      if(ctx.selection){
        res.body = ctx.selection.raw;
        res.flavors = {
          html : ctx.selection.html
        };
      } else {
        var sel = createFlavoredString($X('//blockquote[contains(@class, "text")]/p')[0]);
        res.body = sel.raw;
        res.flavors = {
          html : sel.html
        };
      }
      return res;
    }
  },

  {
    name : 'Amazon',
    getAsin : function(ctx) {
      return $X('id("ASIN")/@value', ctx.document)[0];
    },
    normalizeUrl : function(host, asin) {
      return  'http://' + host + '/o/ASIN/' + asin +
        (this.affiliateId ? '/' + this.affiliateId + '/ref=nosim' : '');
    },
    get affiliateId() {
      return TBRL.config.entry['amazon_affiliate_id'];
    },
    preCheck : function(ctx) {
      return ctx.host.match(/amazon\./) && this.getAsin(ctx);
    },
    extract : function(ctx) {
      ctx.href = this.normalizeUrl(ctx.host, this.getAsin(ctx));
      var pi = $X('id("prodImage")/@alt', ctx.document)[0];
      pi = (!! pi) ? pi + ': ' : '';
      var ti = $X('id("btAsinTitle")/text()', ctx.document);
      ctx.title = 'Amazon: ' + pi + ti;

      // 日本に特化(comの取得方法不明)
      var date = new Date(ctx.document.body.innerHTML.extract('発売日：.*?</b>.*?([\\d/]+)'));
      if (!isNaN(date)) {
        ctx.date = date;
      }
    }
  },

  {
    name : 'Photo - Amazon',
    ICON : 'http://www.amazon.com/favicon.ico',
    check : function(ctx){
      return Extractors.Amazon.preCheck(ctx) && ($X('./ancestor::*[@id="main-image-relative-container"]', ctx.target)[0]
        || $X('./ancestor::*[@id="iv-large-image"]', ctx.target)[0]);
    },
    extract : function(ctx){
      Extractors.Amazon.extract(ctx);

      var url = ctx.target.src.split('.');
      if (url.length > 4) {
        url.splice(-2, 1, 'LZZZZZZZ');
      }
      url = url.join('.').replace('.L.LZZZZZZZ.', '.L.'); // カスタマーイメージ用

      with (ctx.target) {
        src = url;
        height = '';
        width = '';
      }

      return {
        type    : 'photo',
        item    : ctx.title,
        itemUrl : url
      };
    }
  },

  {
    name : 'Quote - Amazon',
    ICON : 'http://www.amazon.com/favicon.ico',
    check : function(ctx){
      return Extractors.Amazon.preCheck(ctx) && ctx.selection;
    },
    extract : function(ctx){
      Extractors.Amazon.extract(ctx);
      return Extractors.Quote.extract(ctx);
    }
  },

  {
    name : 'Link - Amazon',
    ICON : 'http://www.amazon.com/favicon.ico',
    check : function(ctx){
      return Extractors.Amazon.preCheck(ctx);
    },
    extract : function(ctx){
      Extractors.Amazon.extract(ctx);
      return Extractors.Link.extract(ctx);
    }
  },

  {
    name : 'Photo - Flickr',
    ICON : 'http://www.flickr.com/favicon.ico',

    API_KEY : 'ecf21e55123e4b31afa8dd344def5cc5',
    RE : new RegExp('^http://(?:.+?.)?static.?flickr.com/\\d+?/(\\d+?)_.*'),
    getImageId : function(ctx){
      // 他サイトに貼られているFlickrにも対応する
      if(/flickr\.com/.test(ctx.host)){
        // ログインしているとphoto-drag-proxyが前面に表示される
        // アノテーション上の場合はphoto_notesの孫要素となる
        if(
            (ctx.target.src && ctx.target.src.match('spaceball.gif')) || 
          	ctx.target.id == 'photo-drag-proxy' || 
            $X('./ancestor-or-self::div[@id="photo-drag-proxy"]', ctx.target)
        ){
          ctx.target = $X('//div[@class="photo-div"]/img')[0] || ctx.target;
        }
      }

      if(!ctx.target || !ctx.target.src || !ctx.target.src.match(this.RE))
        return;

      return RegExp.$1;
    },
    check : function(ctx){
      return this.getImageId(ctx);
    },
    callMethod : function(ps){
      return request('http://flickr.com/services/rest/', {
        queryString : update({
          api_key        : this.API_KEY,
          nojsoncallback : 1,
          format         : 'json',
        }, ps),
      }).addCallback(function(res){
        eval('var json=' + res.responseText);
        if(json.stat!='ok')
          throw json.message;
        return json;
      });
    },
    getSizes : function(id){
      return this.callMethod({
        method   : 'flickr.photos.getSizes',
        photo_id : id,
      }).addCallback(function(res){
        return res.sizes.size;
      });
    },
    getInfo : function(id){
      return this.callMethod({
        method   : 'flickr.photos.getInfo',
        photo_id : id,
      }).addCallback(function(res){
        return res.photo;
      });
    },
    extract : function(ctx){
      var id = this.getImageId(ctx);
      return new DeferredHash({
        'info'  : this.getInfo(id),
        'sizes' : this.getSizes(id),
      }).addCallback(function(r){
        if(!r.info[0])
          throw new Error(r.info[1].message);

        var info = r.info[1];
        var sizes = r.sizes[1];

        var title = info.title._content;
        ctx.title = title + ' on Flickr'
        ctx.href  = info.urls.url[0]._content;

        var thumbnailSize;
        if (sizes.length >= 6) {
          thumbnailSize = sizes[6]; // may be 'Small'
        } else {
          thumbnailSize = sizes[sizes.length-1];
        }
        var largestSize;
        if (info.rotation == 0) {
          largestSize = sizes.pop();
        } else {
          sizes.pop();
          largestSize = sizes.pop();
        }

        return {
          type      : 'photo',
          item      : title,
          itemUrl   : largestSize.source,
          author    : info.owner.username,
          authorUrl : ctx.href.extract('^(http://.*?flickr.com/photos/.+?/)'),
          license   : info.license,
          date      : info.dates.taken,
          thumbnailUrl   : thumbnailSize.source,
          originalWidth  : largestSize.width,
          originalHeight : largestSize.height,
        }
      }).addErrback(function(err){
        return Extractors['Photo'].extract(ctx);
      });
    },
  },

  {
    name : 'ReBlog',
    TUMBLR_URL : 'http://www.tumblr.com/',
    extractByLink : function(ctx, link){
      var that = this;
      return request(link).addCallback(function(res){
        var text = res.responseText;
        var doc = createHTML(res.responseText);
        ctx.href = link;
        var m = text.match(/<title(?:\s[^>]+?)?>([\S\s]*?)<\/title\s*>/i);
        ctx.title = ((m)? m[1] : '').replace(/[\n\r]/g, '');
        return that.extractByPage(ctx, doc);
      });
    },
    getForm : function(ctx, url){
      var that = this;
      return request(url).addCallback(function(res){
        var doc = createHTML(res.responseText);
        var form = formContents($X('//form', doc)[0]);
        delete form.preview_post;
        form.redirect_to = that.TUMBLR_URL+'dashboard';
        if (form.reblog_post_id) {
          // that.trimReblogInfo(form);
          // Tumblrから他サービスへポストするため画像URLを取得しておく
          if (form['post[type]'] === 'photo') {
            var photoset = $X('id("current_photo")//iframe[contains(concat(" ", normalize-space(@class), " "), " photoset ")]', doc)[0];
            if (photoset) {
              // photo set path
              return request(photoset.getAttribute("src")).addCallback(function(res) {
                var doc2 = createHTML(res.responseText);
                form.image = $X('//div[contains(concat(" ", normalize-space(@class), " "), " photoset ")]//img[contains(@src, "media.tumblr.com/") or contains(@src, "data.tumblr.com/")]/@src', doc2)[0];
                return afterPhoto();
              });
            } else {
              form.image = $X('id("edit_post")//img[contains(@src, "media.tumblr.com/") or contains(@src, "data.tumblr.com/")]/@src', doc)[0];
            }
          }
        }
        return succeed().addCallback(afterPhoto);
        function afterPhoto() {
          if(TBRL.config.entry['not_convert_text'] && form['post[type]'] === 'link'){
            var m = ctx.href.match(/^http:\/\/([^\/]+)\/post\/([^\/]+)\/?/);
            if(m){
              return request('http://'+m[1]+'/api/read', {
                charset: 'text/plain; charset=utf-8',
                queryString: {
                  id: m[2]
                }
              }).addCallback(function(res){
                var xml = createXML(res.responseText);
                var type = xml.getElementsByTagName('post')[0].getAttribute('type');
                if(type === 'regular'){
                  return request(url+'/text').addCallback(function(res){
                    var textDoc = createHTML(res.responseText);
                    var textForm = formContents($X('//form', textDoc)[0]);
                    delete textForm.preview_post;
                    textForm.redirect_to = that.TUMBLR_URL+'dashboard';
                    return textForm;
                  });
                } else {
                  return form;
                }
              });
            }
          }
          return form;
        }
      });
    },
    extractByPage : function(ctx, doc){
      var m = unescapeHTML(this.getFrameUrl(doc)).match(/.+&pid=([^&]*)&rk=([^&]*)/);
      return this.extractByEndpoint(ctx, this.TUMBLR_URL + 'reblog/' + m[1] + '/' + m[2]);
    },
    extractByEndpoint : function(ctx, endpoint){
      var that = this;
      return this.getForm(ctx, endpoint).addCallback(function(form){
        var result = update({
          type     : form['post[type]'],
          item     : ctx.title,
          itemUrl  : ctx.href,
          favorite : {
            name     : 'Tumblr',
            endpoint : endpoint,
            form     : form
          }
        }, that.convertToParams(form));
        return result;
      });
    },
    getFrameUrl : function(doc){
      var elm = $X('//iframe[starts-with(@src, "http://assets.tumblr.com/iframe") and contains(@src, "pid=")]/@src', doc);
      if(elm.length){
        return elm[0];
      } else {
        return null;
      }
    },
    convertToParams  : function(form){
      switch(form['post[type]']){
      case 'regular':
        return {
          type    : 'quote',
          item    : form['post[one]'],
          body    : form['post[two]']
        }
      case 'photo':
        return {
          itemUrl : form.image,
          body    : form['post[two]']
        }
      case 'link':
        return {
          item    : form['post[one]'],
          itemUrl : form['post[two]'],
          body    : form['post[three]']
        };
      case 'quote':
        // FIXME: post[two]検討
        return {
          body    : form['post[one]']
        };
      case 'video':
        // FIXME: post[one]検討
        return {
          body    : form['post[two]']
        };
      case 'conversation':
        return {
          item : form['post[one]'],
          body : form['post[two]']
        };
      case 'audio':
        return {
          body    : form['post[two]'],
          itemUrl : ''
        };
      }
      return null;
    }
  },

  {
    name : 'ReBlog - Tumblr',
    ICON : skin+'reblog.ico',
    check : function(ctx){
      return Extractors.ReBlog.getFrameUrl(ctx.document);
    },
    extract : function(ctx){
      return Extractors.ReBlog.extractByPage(ctx, ctx.document);
    }
  },

  {
    name : 'ReBlog - Dashboard',
    ICON : skin+'reblog.ico',
    check : function(ctx){
      return (/(tumblr-beta\.com|tumblr\.com)\//).test(ctx.href) && this.getLink(ctx);
    },
    extract : function(ctx){
      // タイトルなどを取得するためextractByLinkを使う(reblogリンクを取得しextractByEndpointを使った方が速い)
      return Extractors.ReBlog.extractByLink(ctx, this.getLink(ctx));
    },
    getLink : function(ctx){
      var link = $X(
        './ancestor-or-self::li[starts-with(normalize-space(@class), "post")]//a[starts-with(@id, "permalink_")]', ctx.target)[0];
      return link && link.href;
    }
  },

  {
    name : 'ReBlog - Tumblr Dashboard for iPhone',
    ICON : skin+'reblog.ico',
    getLink: function(ctx){
      var link = $X('./ancestor-or-self::li[starts-with(normalize-space(@id), "post")]//a[contains(concat(" ",normalize-space(@class)," ")," permalink ")]', ctx.target);
      return link && link.href;
    },
    check: function(ctx){
      return (/tumblr\.com\/iphone/).test(ctx.href) && this.getLink(ctx);
    },
    extract: function(ctx){
      return Extractors.ReBlog.extractByLink(ctx, this.getLink(ctx));
    }
  },

  {
    name: 'ReBlog - Tumblr link',
    ICON: skin+'reblog.ico',
    check : function(ctx){
      return ctx.link && ctx.link.href && ctx.link.href.match(/^http:\/\/[^.]+\.tumblr\.com\/post\/\d+/);
    },
    extract: function(ctx){
      return Extractors.ReBlog.extractByLink(ctx, ctx.link.href);
    }
  },

  {
    name     : 'ReBlog - Google+',
    ICON     : 'http://ssl.gstatic.com/s2/oz/images/faviconr.ico',
    HOME_URL : 'https://plus.google.com',

    check : function(ctx) {
      return (/(plus\.google\.com)\//).test(ctx.href) && this.getActivityId(ctx);
    },

    getActivityId : function(ctx) {
      var box = $X(
        './ancestor-or-self::div[starts-with(@id, "update-")]', ctx.target)[0];
      return box && box.id.substr(7);
    },

    extract : function(ctx) {
      var self = this;
      var url  = this.HOME_URL + '/_/stream/getactivity/';
      var id   = this.getActivityId(ctx);
      return request(url + '?' + queryString({
        updateId : id,
        hl       : 'en',
        rt       : 'j'
      })).addCallback(function(res) {
        var data = res.responseText.substr(5).replace(/(\\n|\n)/g, '');
        var data = self.parseJSON(data);
        data = self.getDataByKey(data[0], 'os.u');
        if (!data) return null;
        item = data[1];

        ctx.title = item[3] + ' - Google+';
        ctx.href = self.getAbsoluteURL(item[21]);

        var desc = '';
        var desc1 = item[77] ? item[47] : item[4];
        var desc2 = '';
        if (desc1) {
          desc1 = '<p><a href="' + self.getAbsoluteURL(item[21]) + '">' + item[3] + '</a>:<br />\n' + desc1 + '</p>';
        }
        else {
          desc1 = '<p><a href="' + self.getAbsoluteURL(item[21]) + '">' + item[3] + '</a>:</p>';
        }
        if (item[77]) {
          if (item[4]) {
            desc2 = '<p>' + (item[44][1] && ('<a href="' + self.getAbsoluteURL(item[77]) + '">' + item[44][0] + '</a>:<br />\n')) + item[4] + '</p>';
          }
          else if (item[44][1]) {
            desc2 = '<p><a href="' + self.getAbsoluteURL(item[77]) + '">' + item[44][0] + '</a>:</p>';
          }
        }
        if (desc1 && desc2) {
          desc = joinText([
            desc1,
            '<blockquote>' + desc2 + '</blockquote>',
          ], "\n\n");
        }
        else {
          desc = desc1 || desc2;
        }
        var desc = desc && ('<blockquote>' + desc + '</blockquote>');

        var result = {
          type        : 'link',
          item        : ctx.title,
          itemUrl     : ctx.href,
          body        : desc,
          description : '',
          favorite    : {
            name      : 'Google\\+',
            id        : id
          }
        };

        if (item[11].length) {
          var attachment = item[11][0];
          if (attachment[24][4] === 'video') {
            result = update(result, {
              type        : 'video',
              item        : attachment[3],
              itemUrl     : ctx.href = attachment[24][1],
              body        : attachment[5] && attachment[5][1]
            });
          }
          else if ((attachment[24][4] === 'image')
            || (attachment[24][4] === 'photo')) {
            result = update(result, {
              type        : 'photo',
              itemUrl     : attachment[5] && attachment[5][1],
              body        : joinText([
                attachment[3] && ('<p><a href="' + attachment[24][1] + '">' + attachment[3] + '</a></p>'),
                attachment[21] && ('<p><em>' + attachment[21] + '</em></p>'),
                desc
              ], "\n\n")
           });
          }
          else if ((attachment[24][4] === 'document')
            || (attachment[24][3] === 'text/html')) {
            var attachment2 = item[11][1];
            if (attachment2 && ((attachment2[24][4] === 'image')
              || (attachment2[24][4] === 'photo'))) {
              result = update(result, {
                type        :'photo',
                itemUrl     : attachment2[5] && attachment2[5][1],
                body        : joinText([
                  attachment[3] && ('<p><a href="' + attachment[24][1] + '">' + attachment[3] + '</a></p>'),
                  attachment[21] && ('<p><em>' + attachment[21] + '</em></p>'),
                  desc
                ], "\n\n")
              });
            }
            else if (attachment[21]) {
              result = update(result, {
                type        : 'link',
                item        : attachment[3],
                itemUrl     : ctx.href = attachment[24][1],
                body        : joinText([
                  attachment[21] && ('<p><em>' + attachment[21] + '</em></p>'),
                  desc
                ], "\n\n")
              });
            }
            else {
              result = update(result, {
                type        : 'link',
                item        : attachment[3],
                itemUrl     : ctx.href = attachment[24][1],
                body        : desc
              });
            }
          }
        }
        return result;
      });
    },
    /**
     * Originally made with Open Source software JSAPI by +Mohamed Mansour
     * https://github.com/mohamedmansour/google-plus-extension-jsapi
     */
    parseJSON : function(str) {
      var cleaned = str.replace(/\[,/g, '[null,');
      cleaned = cleaned.replace(/,\]/g, ',null]');
      cleaned = cleaned.replace(/,,/g, ',null,');
      cleaned = cleaned.replace(/,,/g, ',null,');
      cleaned = cleaned.replace(/{(\d+):/g, '{"$1":');
      return JSON.parse(cleaned);
    },
    getDataByKey : function(arr, key) {
      for (var i = 0, len = arr.length ; i < len ; i++) {
        var data = arr[i];
        if (data[0] === key) {
          return data;
        }
      }
      return null;
    },
    getAbsoluteURL : function(url) {
      if (url.substr(0, 2) === './') {
        return this.HOME_URL + url.substr(1);
      }
      else if (url.substr(0, 1) !== '/') {
        return this.HOME_URL + '/' + url;
      }
      else {
        return this.HOME_URL + url;
      }
    }
  },

  {
    name : 'Photo - Google Book Search',
    ICON : 'http://www.google.com/favicon.ico',
    check : function(ctx){
      if(!(/^books\.google\./).test(ctx.host)) {
        return null;
      }
      return !!this.getImage(ctx);
    },
    extract : function(ctx){
      ctx.target = this.getImage(ctx);
      return {
        type    : 'photo',
        item    : ctx.title,
        itemUrl : ctx.target.src
      };
    },
    getImage : function(ctx){
      // 標準モード
      var img = $X('./ancestor::div[@class="pageImageDisplay"]//img[contains(@src, "//books.google.")]', ctx.target)[0];
      if (img) {
        return img;
      }

      // HTMLモード
      var div = $X('./ancestor::div[@class="html_page_image"]', ctx.target)[0];
      if (div) {
        var img = new Image();
        img.src = getStyle(div, 'background-image').replace(/url\((.*)\)/, '$1');

        return img;
      }
      return null;
    }
  },

  {
    name : 'Photo - 4u',
    ICON : skin + '4u.ico',
    check : function(ctx){
      return ctx.onImage &&
        ctx.hostname === '4u-beautyimg.com' &&
        ctx.target.src.match(/\/thumb\/l\/l_/);
    },
    extract : function(ctx){
      var iLoveHer = $X('./ancestor::li//span[starts-with(@id, "love-her-")]/a/@href', ctx.target)[0];
      if (iLoveHer) {
        var source = decodeURIComponent(iLoveHer.extract('src=([^&]*)'));
      }
      if (ctx.onLink && !/^\/image\//.test(ctx.pathname)) {
        ctx.href = ctx.link.href;
      }
      return {
        type      : 'photo',
        item      : $X('./ancestor::li//h2/a/text()', ctx.target)[0] || ctx.title.extract(/(.*) - 4U/i),
        itemUrl   : source || ctx.target.src,
        favorite : {
          name : '4u',
          id : source
        }
      };
    }
  },

  {
    name : 'Photo - Google',
    ICON : 'http://www.google.com/favicon.ico',
    check : function(ctx){
      return (ctx.onLink && ctx.link.href.match('http://lh..(google.ca|ggpht.com)/.*(png|gif|jpe?g)$'));
    },
    extract : function(ctx){
      return request(ctx.link.href).addCallback(function(res){
        return {
          type    : 'photo',
          item    : ctx.title,
          itemUrl : $X('//img[1]', createHTML(res.responseText))[0].src
        }
      });
    }
  },

  {
    name : 'Photo - Picasa',
    ICON : 'http://picasaweb.google.com/favicon.ico',
    check : function(ctx){
      return (/picasaweb\.google\./).test(ctx.host) && ctx.onImage;
    },
    extract : function(ctx){
      var item = $X('//span[@class="gphoto-context-current"]/text()', ctx.document)[0] || $X('//div[@class="lhcl_albumtitle"]/text()', ctx.document)[0] || '';
      return {
        type      : 'photo',
        item      : item.trim(),
        itemUrl   : ctx.target.src.replace(/\?.*/, ''),
        author    : $X('id("lhid_user_nickname")/text()', ctx.document)[0].trim(),
        authorUrl : $X('id("lhid_portraitlink")/@href', ctx.document)[0]
      }
    }
  },

  {
    name : 'Photo - Blogger',
    ICON : 'https://www.blogger.com/favicon.ico',
    check : function(ctx){
      return ctx.onLink &&
        (''+ctx.link).match(/(png|gif|jpe?g)$/i) &&
        (''+ctx.link).match(/(blogger|blogspot)\.com\/.*\/s\d{2,}-h\//);
    },
    extract : function(ctx){
      return {
        type    : 'photo',
        item    : ctx.title,
        itemUrl : (''+ctx.link).replace(/\/(s\d{2,})-h\//, '/$1/')
      }
    }
  },

  {
    name : 'Photo - Google Image Search',
    ICON : 'http://www.google.com/favicon.ico',
    check : function(ctx){
      return ctx.host === 'images.google.co.jp' && ctx.onImage && ctx.onLink;
    },
    extract : function(ctx){
      var link  = $X('parent::a/@href', ctx.target)[0];
      var itemUrl = decodeURIComponent(link.match(/imgurl=([^&]+)/)[1]);
      ctx.href = decodeURIComponent(link.match(/imgrefurl=([^&]+)/)[1]);

      return request(ctx.href).addCallback(function(res){
        ctx.title =
          res.responseText.extract(/<title.*?>([\s\S]*?)<\/title>/im).replace(/[\n\r]/g, '').trim() ||
          createURI(itemUrl).fileName;

        return {
          type    : 'photo',
          item    : ctx.title,
          itemUrl : itemUrl
        }
      });
    }
  },

  {
    name : 'Photo - covered',
    ICON : 'chrome://tombloo/skin/photo.png',
    check : function(ctx){
      if (!ctx.document.elementFromPoint || !ctx.onImage) {
        return null;
      }

      // 1px四方の画像の上でクリックされたか?
      // FIXME: naturalHeight利用
      var img = $N('img', {
        src : ctx.target.src
      });
      return (img.width===1 && img.height===1);
    },
    extract : function(ctx){
//      removeElement(ctx.target);

      return Extractors[ctx.bgImageURL?
        'Photo - background image' :
        'Photo - area element'].extract(ctx);
    }
  },

  {
    name : 'Photo - area element',
    ICON : skin+'photo.png',
    check: function(ctx){
      return ctx.document.elementFromPoint && tagName(ctx.target) === 'area'
    },
    extract : function(ctx){
      var target = ctx.target;
      return {
        type: 'photo',
        item: ctx.title,
        itemUrl: $X('//img[@usemap="#' + target.parentNode.name + '"]', ctx.document)[0].src
      };
    }
  },

  {
    name : 'Photo - image link',
    ICON : skin+'photo.png',
    check : function(ctx){
      if(!ctx.onLink)
        return false;

      var uri = ctx.link.href;
      return uri && (/[^\/]*\.(?:png|gif|jpe?g)$/i).test(uri);
    },
    extract : function(ctx){
      ctx.target = ctx.link;

      return Extractors.Photo.extract(ctx);
    }
  },

  {
    name : 'Photo',
    ICON : skin+'photo.png',
    PROTECTED_SITES : [
      'files.posterous.com/',
      'image.itmedia.co.jp/',
      'wretch.yimg.com/',
      'pics.*\.blog.yam.com/',
      '/www.imgscan.com/image_c.php',
      'keep4u.ru/imgs/',
      '/www.toofly.com/userGallery/',
      '/www.dru.pl/',
      'adugle.com/shareimagebig/',
      '/awkwardfamilyphotos.com/',
      'share-image.com/pictures/big/'
    ],
    check : function(ctx){
      return ctx.onImage;
    },
    extract : function(ctx){
      var target = ctx.target;
      var tag = tagName(target);
      var source =
        tag==='object'? target.data :
        tag==='img'? target.src : target.href;

      /*
      if(this.PROTECTED_SITES.some(function(re){
        return RegExp(re).test(source);
      })){
        return Tombloo.Service.extractors['Photo - Upload from Cache'].extract(ctx);
      };
      */

      // FIXME
      var m = ctx.title.match(/([^\/\s]+) \(\d+×\d+\)$/);
      if(m){
        ctx.title = m[1];
      }

      return {
        type    : 'photo',
        item    : ctx.title,
        itemUrl : source
      }
    }
  },

  {
    name: 'Photo - Upload from Cache',  // not cache... sorry
    ICON: skin + 'photo.png',
    check: function(ctx) {
      return ctx.onImage;
    },
    extract: function(ctx) {
      var contentType = ctx.document.contentType;
      if (contentType && contentType.match(/^image/)) {
        ctx.title = ctx.href.split('/').pop();
      }
      var target = ctx.target;
      var itemUrl = (tagName(target) === 'object') ? target.data : target.src;
      return downloadFile(itemUrl, {
        ext  : getFileExtension(itemUrl)
      }).addCallback(function(url) {
        return {
          type: 'photo',
          item: ctx.title,
          itemUrl: itemUrl,
          fileEntry: url
        };
      });
    }
  },

  {
    name : 'Video - Vimeo',
    ICON : 'http://vimeo.com/favicon.ico',
    check : function(ctx){
      return ctx.host.match(/vimeo\.com/);
    },
    extract : function(ctx){
      var author = $X('//div[@class="byline"]/a', ctx.document)[0];
      return {
        type      : 'video',
        item      : $X('//div[@class="title"]/text()', ctx.document)[0].trim(),
        itemUrl   : ctx.href,
        author    : author.textContent,
        authorUrl : author.href
      };
    }
  },

  {
    name : 'Video - YouTube',
    ICON : 'http://youtube.com/favicon.ico',
    check : function(ctx){
      if (ctx.href.match(/^http:\/\/.*\.youtube\.com\/watch\.*/)) {
        return queryHash(createURI(ctx.href).search).v;
      }
      return false;
    },
    extract : function(ctx){
      // not use @rel="author"
      // because official channel use banner image, can't get author text information by textContent.
      var author_anchor = $X('id("watch-channel-stats")/a', ctx.document)[0] || $X('id("watch-username")', ctx.document)[0] || $X('id("watch-uploader-info")/descendant::a[contains(concat(" ", normalize-space(@rel), " "), " author ")]')[0];
      if (author_anchor) {
        var author = author_anchor.textContent.trim();
        var authorUrl = author_anchor.href;
      } else {
        var banner = $X('id("watch-userbanner")')[0];
        var author = banner.title;
        var authorUrl = banner.href;
      }
      ctx.title = ctx.title.replace(/[\n\r\t]+/gm, ' ').trim();
      return {
        type      : 'video',
        item      : $X('//meta[@property="og:title"]/@content')[0] || ctx.title.extract(/(.*) - /),
        itemUrl   : ctx.href,
        author    : author,
        authorUrl : authorUrl
      };
    }
  },

  {
    name : 'Video - Google Video',
    ICON : 'http://www.google.com/favicon.ico',
    check : function(ctx){
      return ctx.host.match(/video\.google\.com/);
    },
    extract : function(ctx){
      return {
        type    : 'video',
        item    : ctx.title,
        itemUrl : ctx.href,
        body    : $X('id("embed-video")/textarea/text()', ctx.document)[0]
      }
    }
  },

  {
    name : 'Video - MySpaceTV',
    ICON : 'http://vids.myspace.com/favicon.ico',
    check : function(ctx){
      return ctx.host.match(/vids\.myspace\.com/) && this.getTag(ctx);
    },
    extract : function(ctx){
      var tag = this.getTag(ctx);
      ctx.href = tag.extract(/href="(.+?)"/);

      return {
        type    : 'video',
        item    : tag.extract(/<a.+?>(.+?)<\/a>/),
        itemUrl : ctx.href,
        body    : tag.extract(/(<object.+object>)/)
      };
    },
    getTag : function(ctx){
      return $X('id("tv_embedcode_embed_text")/@value', ctx.document)[0];
    }
  },

  {
    name : 'Video - Dailymotion',
    ICON : 'http://www.dailymotion.com/favicon.ico',
    check : function(ctx){
      return ctx.host.match(/dailymotion\.com/) && this.getTag(ctx);
    },
    extract : function(ctx){
      var tag = this.getTag(ctx);
      ctx.href = tag.extract(/href="(.+?)"/);

      return {
        type      : 'video',
        item      : ctx.title.extract(/Dailymotion - (.*?) - /),
        itemUrl   : ctx.href,
        body      : tag.extract(/(<object.+object>)/)
      };
    },
    getTag : function(ctx){
      return $X('id("video_player_embed_code_text")/@value', ctx.document)[0];
    }
  },

  {
    name : 'Video - Nico Nico Douga',
    ICON : 'http://www.nicovideo.jp/favicon.ico',
    check : function(ctx){
      return ctx.href.match(/^http:\/\/www\.nicovideo\.jp\/watch\//);
    },
    extract : function(ctx){
      var embedUrl = resolveRelativePath(ctx.href)($X('descendant::a[starts-with(@href, "/embed/")]/@href', ctx.document)[0]);
      return request(embedUrl, {charset : 'utf-8'}).addCallback(function(res){
        var doc = createHTML(res.responseText);
        return {
          type    : 'video',
          item    : ctx.title,
          itemUrl : ctx.href,
          body    : $X('//input[@name="script_code"]/@value', doc)[0]
        };
      });
    }
  },

  {
    name : 'Audio',
    ICON : skin+'audio.png',
    check: function(ctx){
      return (tagName(ctx.target) === 'audio') && ctx.target.src;
    },
    extract: function(ctx){
      var src = ctx.target.src;
      var ext = '';
      var m = src.match(/([^\/\s]+)$/);
      if(m){
        ctx.title = m[1];
      }
      m = src.match(/[^\/\s\.]*(\.[^\/\s\.])$/);
      if(m){
        ext = m[1];
      }
      return {
        type   : 'audio',
        itemUrl: src,
        suffix : ext,
        item   : ctx.title
      };
    }
  },

  {
    name : 'Quote',
    ICON : skin+'quote.png',
    check : function(ctx){
      return ctx.selection;
    },
    extract : function(ctx){
      return {
        type    : 'quote',
        item    : ctx.title,
        itemUrl : ctx.href,
        body    : ctx.selection.raw,
        flavors : {
          html    : ctx.selection.html
        }
      };
    }
  },

  {
    name : 'Link - link',
    ICON : skin+'link.png',
    check: function(ctx){
      return ctx.onLink;
    },
    extract: function(ctx){
      var title = ctx.target.textContent;
      if(!title || title === ctx.target.href)
        title = ctx.title;

      return {
        type: 'link',
        item: title,
        itemUrl: ctx.link.href
      }
    }
  },

  {
    name : 'Link',
    ICON : skin+'link.png',
    check : function(ctx){
      return true;
    },
    extract : function(ctx){
      return {
        type    : 'link',
        item    : ctx.title,
        itemUrl : ctx.href
      }
    }
  },

  {
    name : 'Photo - background image',
    ICON : skin+'photo.png',
    check : function(ctx){
      if(ctx.target && ctx.document){
        var bg = Extractors['Photo - background image'].lookupBG(ctx.target, ctx.document);
        if(bg){
          var m = bg.match(/url\s*\(\s*['"]?\s*(https?[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)\s*['"]?\s*\)/);
          if(m) ctx.bgImageURL = m[1];
        }
      }
      return ctx.bgImageURL;
    },
    lookupBG: function(elm, doc){
      if(elm !== doc){
        return (function(target){
          var bg = getComputedStyle(target, '').backgroundImage;
          if ((bg !== 'none') && bg) {
            return bg;
          } else {
            var parent = target.parentNode;
            if(parent === doc || !parent){
              return null;
            } else {
              return arguments.callee(parent);
            }
          }
        })(elm);
      } else {
        return null;
      }
    },
    extract : function(ctx){
      return {
        type    : 'photo',
        item    : ctx.title,
        itemUrl : ctx.bgImageURL
      }
    }
  },

  {
    // Region Capture のみ対応
    name : 'Photo - Capture',
    ICON : skin+'photo.png',
    TARGET_BACKGROUND: "#888",
    check : function(ctx){
      return true;
    },
    extract : function(ctx){
      var self = this;
      // ショートカットキーからポストするためcaptureTypeを追加
      // var type = ctx.captureType || input({'Capture Type' : ['Region', 'Element', 'View', 'Page']});
      var type = ctx.captureType || 'Region';
      if (!type) {
        return null;
      }

      var win = ctx.window;
      self.makeOpaqueFlash(ctx.document);

      return succeed().addCallback(function(){
        switch (type){
        case 'Region':
          return self.selectRegion(ctx).addCallback(function(region){
            return self.capture(win, region.position, region.dimensions);
          });

        case 'Element':
          return self.selectElement(ctx).addCallback(function(elm){
            var rect = elm.getBoundingClientRect();
            return self.capture(win, {x: Math.round(rect.left), y: Math.round(rect.top)}, getElementDimensions(elm));
          });

        case 'View':
          return self.capture(win, getViewportPosition(), getViewDimensions());

        case 'Page':
          return self.capture(win, {x:0, y:0}, getPageDimensions());
        }
        return null;
      }).addCallback(function(file){
        return {
          type: 'photo',
          item: ctx.title,
          fileEntry: file
        };
      });
    },
    capture: function(win, pos, dim, scale){
      // Google Chrome doesn't support CanvasRenderingContext2D#drawWindow
      var ret = new Deferred();
      var width = win.innerWidth;
      chrome.extension.sendMessage(TBRL.id, {
        request: "capture"
      }, function(res){
        var img = new Image();
        img.addEventListener('load', function(ev){
          img.removeEventListener('load', arguments.callee, false);
          scale = (img.naturalWidth === width)? null : img.naturalWidth / width;
          var canvas = document.createElement('canvas');
          var size = {w: 0, h: 0};
          var ctx = canvas.getContext('2d');
          if(scale){
            scale  = scale.w? scale.w/dim.w :
              scale.h? scale.h/dim.h : scale;
            canvas.width  = size.w = dim.w;
            canvas.height = size.h = dim.h;
            dim.w *= scale;
            dim.h *= scale;
            pos.x *= scale;
            pos.y *= scale;
          } else {
            canvas.width  = size.w = dim.w;
            canvas.height = size.h = dim.h;
          }
          ctx.drawImage(img, pos.x, pos.y, dim.w, dim.h, 0, 0, size.w, size.h);
          base64ToFileEntry(canvas.toDataURL('image/png', '')).addCallback(function(url) {
            ret.callback(url);
          });
        }, false);
        img.src = res;
      });
      return ret;
    },
    makeOpaqueFlash: function(doc){
      doc = doc || document;

      $X('//*[self::object or self::embed][contains(@type, "flash")][boolean(@wmode)=false or (@wmode!="opaque" and @wmode!="transparent")]', doc).forEach(function(flash){
        flash.setAttribute('wmode', 'opaque');
        flash = swapDOM(flash, flash.cloneNode(false));
        flash.offsetWidth;
      });
    },
    selectElement: function(ctx){
      var deferred = new Deferred();
      var self = this;
      var doc = ctx ? ctx.document : document;

      var target;
      function onMouseOver(e){
        target = e.target;
        target.originalBackground = target.style.background;
        target.style.background = self.TARGET_BACKGROUND;
      }
      function onMouseOut(e){
        unpoint(e.target);
      }
      function onClick(e){
        cancel(e);

        finalize();
        deferred.callback(target);
      }
      function onKeyDown(e){
        cancel(e);

        switch(keyString(e)){
        case 'ESCAPE':
          finalize();
          deferred.cancel();
          return;
        }
      }
      function unpoint(elm){
        if(elm.originalBackground!=null){
          elm.style.background = elm.originalBackground;
          elm.originalBackground = null;
        }
      }
      function finalize(){
        doc.removeEventListener('mouseover', onMouseOver, true);
        doc.removeEventListener('mouseout', onMouseOut, true);
        doc.removeEventListener('click', onClick, true);
        doc.removeEventListener('keydown', onKeyDown, true);

        unpoint(target);
      }

      doc.addEventListener('mouseover', onMouseOver, true);
      doc.addEventListener('mouseout', onMouseOut, true);
      doc.addEventListener('click', onClick, true);
      doc.addEventListener('keydown', onKeyDown, true);

      return deferred;
    },
    selectRegion: function(ctx){
      var deferred = new Deferred();
      var doc = ctx ? ctx.document : document;

      var win = doc.defaultView;

      doc.documentElement.style.cursor = 'crosshair';

      var style = doc.createElement('style');
      style.innerHTML =
        "* {\n" +
        "  cursor: crosshair !important;\n" +
        "  -webkit-user-select: none;\n" +
        "}\n" +
        "div.taberareloo_capture_size {\n" +
        "  padding: 5px !important;\n" +
        "  border-radius: 5px !important;\n" +
        "  opacity: 0.7 !important;\n" +
        "  position: fixed !important;\n" +
        "  z-index: 999999999 !important;\n" +
        "  background-color: gray !important;\n" +
        "  color: white !important;\n" +
        "}\n";
      doc.body.appendChild(style);


      var region, p, d, moving, square, size;
      function mouse(e){
        return {
          x: e.clientX,
          y: e.clientY
        };
      }

      function onMouseMove(e){
        var to = mouse(e);

        if(moving){
          var px = to.x - d.w, py = to.y - d.h;
          if(px > window.innerWidth)
            px = window.innerWidth;
          if(py > window.innerHeight)
            py = window.innerHeight;
          p.x = Math.max(px, 0);
          p.y = Math.max(py, 0);
        }

        d = {
          w: to.x - p.x,
          h: to.y - p.y
        };

        var minusW = (d.w < 0), minusH = (d.h < 0);

        if(square){
          var s = Math.min(Math.abs(d.w), Math.abs(d.h));
          d.w = (minusW)? -(s) : s;
          d.h = (minusH)? -(s) : s;

        }
        var d2 = update({}, d), p2 = update({}, p);

        if(minusW || minusH){
          // 反転モード
          if(d2.w < 0){
            p2.x = p.x + d2.w;
            d2.w = -d2.w;
            if(p2.x < 0){
              d2.w += p2.x;
              p2.x = 0;
            }
          }
          if(d2.h < 0){
            p2.y = p.y + d2.h;
            d2.h = -d2.h;
            if(p2.y < 0){
              d2.h += p2.y;
              p2.y = 0;
            }
          }
          d.w = (minusW)? -(d2.w) : d2.w;
          d.h = (minusH)? -(d2.h) : d2.h;
        }

        var rx = p2.x + d2.w;
        if(rx > window.innerWidth){
          rx = (rx - window.innerWidth);
          d.w -= rx;
          d2.w -= rx;
        }
        var ry = p2.y + d2.h;
        if(ry > window.innerHeight){
          ry = (ry - window.innerHeight);
          d.h -= ry;
          d2.h -= ry;
        }

        if(square){
          if(d2.w < d2.h){
            var s = d2.w;
            if(minusH){
              p2.y += d2.h - s
              d.h = -(s);
            } else {
              d.h = s;
            }
            d2.h  = s
          } else {
            var s = d2.h;
            if(minusW){
              p2.x += d2.w - s
              d.w = -(s);
            } else {
              d.w = s;
            }
            d2.w  = s
          }
        }

        setElementPosition(region, p2);
        setElementDimensions(region, d2);
        $D(size);
        size.appendChild($T(d2.w + ' × ' + d2.h));
        // Sketch Switch
        // size.appendChild($T('× / _ / ×'));

        setStyle(size, {
          'top'  : to.y+10+'px',
          'left' : to.x+10+'px'
        });
      }

      function onMouseDown(e){
        cancel(e);

        p = mouse(e);
        region = doc.createElement('div');
        setStyle(region, {
          'background': '#888',
          'opacity'   : '0.5',
          'position'  : 'fixed',
          'zIndex'    : '999999999',
          'top'       : p.y+'px',
          'left'      : p.x+'px'
        });
        doc.body.appendChild(region);
        size = $N('div', {
          'class' : 'taberareloo_capture_size'
        });
        doc.body.appendChild(size);

        doc.addEventListener('mousemove', onMouseMove, true);
        doc.addEventListener('mouseup', onMouseUp, true);
        win.addEventListener('keydown', onKeyDown, true);
        win.addEventListener('keyup', onKeyUp, true);
      }

      function onKeyDown(e){
        cancel(e);

        switch(keyString(e)){
        case 'SHIFT': square = true; return;
        case 'SPACE': moving = true; return;
        case 'ESCAPE':
          finalize();
          deferred.cancel();
          return;
        }
      }

      function onKeyUp(e){
        cancel(e);

        switch(keyString(e)){
        case 'SHIFT': square = false; return;
        case 'SPACE': moving = false; return;
        }
      }

      function onMouseUp(e){
        cancel(e);

        var rect = region.getBoundingClientRect();
        p = {x: Math.round(rect.left), y: Math.round(rect.top)};
        finalize();

        // FIXME: 暫定/左上方向への選択不可/クリックとのダブルインターフェース未実装
        if(!d){
          deferred.cancel();
          return;
        }
        d.w = Math.abs(d.w), d.h = Math.abs(d.h);

        deferred.callback({
          position: p,
          dimensions: d
        });
      }

      function onClick(e){
        // リンククリックによる遷移を抑止する
        cancel(e);

        // mouseupよりも後にイベントが発生するため、ここで取り除く
        doc.removeEventListener('click', onClick, true);
      }

      function finalize(){
        doc.removeEventListener('mousedown', onMouseDown, true);
        doc.removeEventListener('mousemove', onMouseMove, true);
        doc.removeEventListener('mouseup', onMouseUp, true);
        win.removeEventListener('keydown', onKeyDown, true);
        win.removeEventListener('keyup', onKeyUp, true);

        doc.documentElement.style.cursor = '';

        removeElement(region);
        removeElement(size);
        removeElement(style);
      }

      doc.addEventListener('mousedown', onMouseDown, true);
      doc.addEventListener('click', onClick, true);
      doc.defaultView.focus();

      return deferred;
    }
  },

  {
    name : 'Text',
    ICON : skin+'text.png',
    check : function(ctx){
      return true;
    },
    extract : function(ctx){
      return {
        type : 'regular'
      }
    }
  }
]);

