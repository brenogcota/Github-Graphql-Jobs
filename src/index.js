const express = require("express")
const path = require('path')
require('dotenv').config()
const { engine } = require('express-handlebars')

const app = express()
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, '/views'))

app.use('/public', express.static(path.join(__dirname, '..', '/public')))

const baseUrl = "https://api.github.com/graphql"

const { GraphQLClient } = require("graphql-request")

const client = new GraphQLClient(baseUrl, {
  headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
})

app.get('/', async (req, res, next) => {
  const page = req.query.page || 1
  const last = page * 10
  const owner = req.query.repo || "backend-br"
  try {
    const query = `
      query { 
        repository(name:"vagas", owner: "${owner}") {
          issues(first: ${last}, states: [OPEN], orderBy: { field: CREATED_AT, direction: DESC }) {
            totalCount
            edges {
              node {
                state
                title
                number
                url
                author {
                  avatarUrl
                  login
                  url
                }
              }
            }
          }
          createdAt
        }
      }
    `
  
    const { repository: { issues }} = await client.request(query)
    const totalCount = Array.from({length: issues.totalCount}, (_, i) => i + 1)
    res.render('home', { issues: issues.edges, totalCount })
    
  } catch (error) {
    next(error)
  }
})

app.get("/vagas/:id", async (req, res, next) => {
  const owner = req.query.repo || "backend-br"
  try {
    const query = `
      query { 
        repository(name:"vagas", owner: "${owner}") {
          issue(number: ${req.params.id}) {
            labels(first: 3) {
              edges {
                node {
                  name
                }
              }
            }
            title
            bodyText
            author {
              avatarUrl
              login
              url
            }
            state
          }
        }
      }
    `
  
    const data = await client.request(query)
    res.json(data)
    
  } catch (error) {
    next(error)
  }
})

app.use((error, req, res, next) => {
  res.send(error)
})

app.listen(4000)