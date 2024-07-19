import { CreateWebWorkerMLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm"

const $ = (element) => document.querySelector(element)

const $form = $('form')
const $input = $('input')
const $template = $('#message-template')
const $messages = $('ul')
const $container = $('main')
const $button = $('button')
const $info = $('small')
const $loading = $('.loading')

let messages = []
let end = false

//ia model
const selectedModel = 'Llama-3-8B-Instruct-q4f32_1-MLC-1k'

const engine = await CreateWebWorkerMLCEngine(
    new Worker('./worker.js', { type: 'module' }),
    selectedModel,
    { 
        initProgressCallback: (info) => {
            $info.textContent = info.text
            if (info.progress === 1 && !end) {
                end = true
                $loading?.parentNode?.removeChild($loading)
                $button.removeAttribute('disabled')
                addMessage('Hola, en que puedo ayudarte?', 'bot')
                $input.focus()
            }
            
        } 
    }
)


$form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const messageText = $input.value.trim()

    if (messageText !== ''){
        $input.value = ''
    } 
 
    //user message
    addMessage(messageText, 'user')
    $button.setAttribute('disabled',true)

    const userMessage = {
        role: 'user',
        content: messageText
    }
    messages.push(userMessage)


    //ia reply
    const chunks = await engine.chat.completions.create({
        messages,
        stream: true
    }) 

    let reply = ''
    const $iaMessage = addMessage('','bot') 

    for await (const chunk of chunks) {
        const choice = chunk.choices[0]
        const content = choice?.delta?.content ?? ""
        reply += content
        $iaMessage.textContent = reply
    }

    $button.removeAttribute('disabled')
    messages.push({
        role: 'ia',
        content: reply
    })
    $container.scrollTop = $container.scrollHeight
})

function addMessage(text, sender) {
    const clonedTemplate = $template.content.cloneNode(true)
    const $newMessage = clonedTemplate.querySelector('.message')
    const $who = $newMessage.querySelector('span')
    const $text = $newMessage.querySelector('p')

    $text.textContent = text
    $who.textContent = sender === 'bot' ? 'IA' : 'Tú'
    $newMessage.classList.add(sender)

    $messages.appendChild($newMessage)
    $container.scrollTop = $container.scrollHeight

    return $text

}

