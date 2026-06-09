
var puml = (() => {
  var server = 'https://www.plantuml.com/plantuml'
  var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'

  // 中文注释：PlantUML Server 使用一套接近 Base64 的自定义字符表。
  var encode64 = (data) => {
    var encoded = ''

    var append3bytes = (b1, b2, b3) => {
      var c1 = b1 >> 2
      var c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
      var c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
      var c4 = b3 & 0x3F

      encoded += alphabet[c1] + alphabet[c2] + alphabet[c3] + alphabet[c4]
    }

    for (var i = 0; i < data.length; i += 3) {
      if (i + 2 === data.length) {
        append3bytes(data[i], data[i + 1], 0)
      }
      else if (i + 1 === data.length) {
        append3bytes(data[i], 0, 0)
      }
      else {
        append3bytes(data[i], data[i + 1], data[i + 2])
      }
    }

    return encoded
  }

  var hex = (source) => {
    var bytes = new TextEncoder().encode(source)
    var encoded = ''

    bytes.forEach((byte) => {
      encoded += byte.toString(16).padStart(2, '0')
    })

    return '~h' + encoded
  }

  var deflate = async (source) => {
    if (typeof CompressionStream !== 'function') {
      throw new Error('当前浏览器不支持 CompressionStream')
    }

    var bytes = new TextEncoder().encode(source)
    var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    var buffer = await new Response(stream).arrayBuffer()

    return encode64(new Uint8Array(buffer))
  }

  // 中文注释：优先使用官方压缩编码；浏览器不支持时回退到官方 HEX 编码。
  var encode = async (source) => {
    try {
      return await deflate(source)
    }
    catch (err) {
      console.warn('[Markdown Viewer] PlantUML 压缩编码失败，已回退到 HEX 编码。', err)
      return hex(source)
    }
  }

  var wait = (image) => new Promise((resolve) => {
    if (image.complete) {
      resolve()
      return
    }

    var done = () => {
      clearTimeout(timeout)
      resolve()
    }
    var timeout = setTimeout(done, 5000)

    image.addEventListener('load', done, {once: true})
    image.addEventListener('error', done, {once: true})
  })

  // 中文注释：把代码块替换为远程 SVG 图片，同时保留可打开原图的链接。
  var createDiagram = (url, source) => {
    var container = document.createElement('div')
    var link = document.createElement('a')
    var image = document.createElement('img')

    container.className = 'plantuml'
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    image.alt = 'PlantUML 图表'
    image.loading = 'lazy'
    image.decoding = 'async'

    image.addEventListener('error', () => {
      container.classList.add('plantuml-error')
      container.textContent = 'PlantUML 渲染失败，请检查网络连接或图表语法。'
      console.error('[Markdown Viewer] PlantUML 渲染失败。', {url, source})
    }, {once: true})

    image.src = url
    link.appendChild(image)
    container.appendChild(link)

    return {container, image}
  }

  return {
    loaded: false,
    // 中文注释：渲染流程由 scroll.js 等待，避免远程图片加载导致恢复滚动位置偏移。
    render: async () => {
      var diagrams = Array.from(document.querySelectorAll('pre code.plantuml'))

      if (!diagrams.length) {
        puml.loaded = true
        return
      }

      puml.loaded = false
      console.info('[Markdown Viewer] PlantUML 开始渲染。', {count: diagrams.length})

      try {
        await Promise.all(diagrams.map(async (diagram) => {
          var source = diagram.textContent.trim()

          if (!source) {
            return
          }

          var url = server + '/svg/' + await encode(source)
          var rendered = createDiagram(url, source)

          diagram.parentElement.replaceWith(rendered.container)
          await wait(rendered.image)
        }))
      }
      finally {
        puml.loaded = true
        console.info('[Markdown Viewer] PlantUML 渲染流程结束。')
      }
    }
  }
})()
