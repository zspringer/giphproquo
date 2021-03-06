import vue from 'vue'
import vuex from 'vuex'
import $ from 'jquery'

vue.use(vuex)

var state = {
    results: [],
    submissions: [],
    quote: { content: "Loading..." },
    gifResponses: [],
    username: '',
    loggedIn: false
}

$.ajaxSetup({
    crossDomain: true,
    xhrFields: {
        withCredentials: true
    }
})

var actions = {
    search({ commit, dispatch }, { query, offset }) {
        var base = 'http://api.giphy.com/v1/gifs/'
        var queryPrefix = 'search?q='
        var limiter = '&limit=24'
        var queryOffset = '&offset=' + offset
        var apiKey = '&api_key=f097ee268bc6401291558d9b639c2970'
        var url = `${base}${queryPrefix}${query}${queryOffset}${apiKey}${limiter}`

        commit('resetResults');

        fetch(url)
            .then(data => {
                data.json().then(gifs => {
                    commit('setResults', gifs.data)
                })
            })
            .catch(error => {
                console.log(error)
            });
    },
    gifVote({ commit, dispatch }, { gifId, vote }) {
        $.ajax({
            method: 'PUT',
            contentType: 'application/json',
            url: '//localhost:3000/api/gifResponses/' + gifId + "/vote",
            data: JSON.stringify({ vote: vote })
        })
            .then(data => {
                commit('updateGifResponseScore', { gifId: data._id, score: data.totalScore });
            })
            .fail(data => {
                console.log(data)
            })
    },
    getQuote({ commit, dispatch }) {
        $.get('//localhost:3000/api/quotes').then(data => {
            commit('setQuote', data);
            dispatch('getGifs', data._id)
        })
    },
    createQuote({ commit, dispatch }, content) {
        $.post('//localhost:3000/api/quotes', { content: content })
            .then(data => {
                commit('setQuote', data);
                commit('setGifResponses', [])
            })
            .fail(data => {
                console.log(data)
            })

    },
    getNextQuote({ commit, dispatch }, quoteId) {
        dispatch('getNewQuote', { isNext: true, quoteId: quoteId })
    },
    getPrevQuote({ commit, dispatch }, quoteId) {
        dispatch('getNewQuote', { isNext: false, quoteId: quoteId })
    },
    getNewQuote({ commit, dispatch }, { isNext, quoteId }) {
        let baseUrl = `//localhost:3000/api/quotes/${quoteId}/`
        baseUrl += isNext ? 'next' : 'prev';
        $.get(baseUrl)
            .then(data => {
                commit('setQuote', data);
                dispatch('getGifs', data._id)
            })
            .fail(data => {
                console.log(data)
            })
    },
    getGifs({ commit, dispatch }, quoteId) {
        return $.get(`//localhost:3000/api/quotes/${quoteId}/gifResponses`)
            .then(data => {
                commit('setGifResponses', data)
            })
            .fail(data => {
                console.log(data)
            })
    },
    addGifResponse({ commit, dispatch }, { quoteId, gif }) {
        gif.quoteId = quoteId;
        gif.gifUrl = gif.images.original.url;
        $.post('//localhost:3000/api/gifResponses', gif).then(data => {
            dispatch('getGifs', quoteId);
        })
            .fail(data => {
                console.log(data)
            })
    },
    getComments({ commit, dispatch }, gifId) {
        $.get(`//localhost:3000/api/gifResponses/${gifId}/comments`).then(data => {

        })
    },
    checkForUser({ commit, dispatch }) {
        $.get('//localhost:3000/authenticate')
            .then(data => {
                if (data.data)
                    commit('setLoggedIn', { username: data.data.username, loggedIn: true })
            })
            .fail(data => {
                console.log(data);
            })
    },
    logOut({ commit, dispatch }) {
        $.ajax({
            method: 'DELETE',
            contentType: 'application/json',
            url: '//localhost:3000/logout/',
        })
            .then(data => {
                commit('setLoggedIn', { username: '', loggedIn: false })
            })
            .fail(data => {
                console.log(data)
            })
    },
    register({ commit, dispatch }, user) {
        $.post('//localhost:3000/register', user)
            .then(data => {
                commit('setLoggedIn', { username: data.data.username, loggedIn: true })
            })
            .fail(data => {
                console.log(data.message)
            })
    },
    login({ commit, dispatch }, user) {
        $.post('//localhost:3000/login', user)
            .then(data => {
                if (data.data)
                    commit('setLoggedIn', { username: data.data.username, loggedIn: true })
            })
            .fail(data => {
                console.log(data.message)
            })
    }
}

var mutations = {
    setQuote(state, quote) {
        state.quote = quote;
    },
    setGifResponses(state, responses) {
        state.gifResponses = responses;
    },
    setResults(state, results) {
        state.results = results;
    },
    resetResults(state) {
        state.results = [];
    },
    updateGifResponseScore(state, { gifId, score }) {
        var gifIndex = state.gifResponses.findIndex(gif => gif._id == gifId);
        vue.set(state.gifResponses[gifIndex], 'totalScore', score);
    },
    setLoggedIn(state, { username, loggedIn }) {
        state.username = username;
        state.loggedIn = loggedIn;
    }
}

export default new vuex.Store({
    state,
    actions,
    mutations
})