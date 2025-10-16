
// Variables globales
let allPokemon = [];
let filteredPokemon = [];
let displayedPokemon = [];
let currentOffset = 0;
const limit = 20;
let isLoading = false;
let allTypes = [];
const pokemonCache = {};

// Inicializar la aplicación
async function init() {
    await loadTypes();
    await loadInitialPokemon();
}

// Cargar tipos de Pokémon
async function loadTypes() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/type');
        const data = await response.json();
        allTypes = data.results;
        
        const typeFilter = document.getElementById('typeFilter');
        allTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);
            typeFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando tipos:', error);
    }
}

// Cargar Pokémon iniciales
async function loadInitialPokemon() {
    try {
        setLoading(true);
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1000`);
        const data = await response.json();
        allPokemon = data.results;
        filteredPokemon = [...allPokemon];
        
        await loadMorePokemon();
        updateTotalCount();
    } catch (error) {
        console.error('Error cargando Pokémon:', error);
    }
}

// Cargar más Pokémon (paginación)
async function loadMorePokemon() {
    if (isLoading || currentOffset >= filteredPokemon.length) return;
    
    isLoading = true;
    setLoading(true);

    const batch = filteredPokemon.slice(currentOffset, currentOffset + limit);
    
    try {
        // Cargar detalles en paralelo con Promise.all
        const promises = batch.map(pokemon => fetchPokemonDetails(pokemon.url));
        const pokemonDetails = await Promise.all(promises);
        
        displayedPokemon = [...displayedPokemon, ...pokemonDetails];
        renderPokemonGrid(pokemonDetails, true);
        
        currentOffset += limit;
    } catch (error) {
        console.error('Error cargando detalles:', error);
    } finally {
        isLoading = false;
        setLoading(false);
    }
}

// Obtener detalles de un Pokémon
async function fetchPokemonDetails(url) {
    if (pokemonCache[url]) {
        return pokemonCache[url];
    }

    const response = await fetch(url);
    const data = await response.json();
    pokemonCache[url] = data;
    return data;
}

// Renderizar la cuadrícula
function renderPokemonGrid(pokemonList, append = false) {
    const grid = document.getElementById('pokemonGrid');
    
    if (!append) {
        grid.innerHTML = '';
    }

    if (pokemonList.length === 0 && !append) {
        showError('❌ No se encontraron Pokémon con ese criterio');
        return;
    }

    hideError();

    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.onclick = () => openPokemonModal(pokemon);
        
        card.innerHTML = `
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <div class="pokemon-card-name">${pokemon.name}</div>
            <div class="pokemon-card-id">#${pokemon.id.toString().padStart(3, '0')}</div>
            <div class="mt-2">
                ${pokemon.types.map(t => `<span class="mini-type-badge">${t.type.name}</span>`).join('')}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Actualizar contador
function updateTotalCount() {
    document.getElementById('totalCount').textContent = 
        `Total: ${filteredPokemon.length} Pokémon`;
}

// BUSQUEDA DE POKEMON
async function searchPokemon() {
    const input = document.getElementById('searchInput');
    const query = input.value.toLowerCase().trim();

    //Validar busqueda no vacia
    if (!validateQuery(query)) return;

    hideError();
    setLoading(true);

    try{
        let pokemon;
        
        //Verificamos en cache si esta el pokemon
        if (pokemonCache[query]){
            pokemon = pokemonCache[query];
        }else {
            //Se realiza la peticion ya que no esta en cache
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

            if(!response.ok){
                throw new Error('Pokémon no encontrado');
            }

            pokemon = await response.json();

            //Guarda en cache el resultado
            pokemonCache[query] = pokemon;
        }

        //Mostrar datos
        displayPokemon(pokemon);
        setLoading(false);
        resetCard(); //La posicion de la carta vuelve a su estado original

    }catch (error){
        setLoading(false);
        showError('❌ ' + error.message + '. Intenta con otro nombre o ID.');
    }
}

//VALIDACIONES
function validateQuery(query) {
    if (query.trim() === '') {
        showError('Por favor ingresa un nombre o ID de Pokémon');
        return false;
    }

    return true;
}

//MANEJO DE ERRORES
function showError(message) {
    const errorDiv = document.getElementById('errorAlert');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    document.getElementById('cardContainer').classList.add('d-none');
}

function hideError() {
    document.getElementById('errorAlert').classList.add('d-none');
}

//LOADING
function setLoading(isLoading) {
    const loadingDiv = document.getElementById('loading');
    if (isLoading) {
        loadingDiv.classList.remove('d-none');
    } else {
        loadingDiv.classList.add('d-none');
    }
}


//MOSTRAR DATOS 
function displayPokemon(pokemon){
    // Datos principales
    document.getElementById('pokemonId').textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
    document.getElementById('pokemonName').textContent = pokemon.name;
    document.getElementById('pokemonImage').src = pokemon.sprites.front_default || 'https://via.placeholder.com/200';

    // Tipos
    const typesContainer = document.getElementById('pokemonTypes');
    typesContainer.innerHTML = pokemon.types
                                      .map(t => `<div class="btn btn-outline-light" disabled>${t.type.name}</div>`)
                                      .join('');

    // Estadísticas
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = pokemon.stats
        .map(stat => `
            <div class="col-6">
                <div class="stat-box">
                    <div class="stat-name">${stat.stat.name}</div>
                    <div class="stat-value">${stat.base_stat}</div>
                </div>
            </div>
        `)
        .join('');

    // Mostrar card
    document.getElementById('cardContainer').classList.remove('d-none');
}

 // Función para hacer flip
function toggleCardFlip() {
    document.getElementById('card').classList.toggle('flipped');
}

// Función para resetear la card a posición inicial
function resetCard() {
    document.getElementById('card').classList.remove('flipped');
}


document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchPokemon();
    }
});


init();