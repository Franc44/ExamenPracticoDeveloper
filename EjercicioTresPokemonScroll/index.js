
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
    setupEventListeners();
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

// Abrir modal con detalles
function openPokemonModal(pokemon) {
    document.getElementById('modalPokemonId').textContent = 
        `#${pokemon.id.toString().padStart(3, '0')}`;
    document.getElementById('modalPokemonName').textContent = pokemon.name;
    document.getElementById('modalPokemonImage').src = pokemon.sprites.front_default;
    
    const typesContainer = document.getElementById('modalPokemonTypes');
    typesContainer.innerHTML = pokemon.types
        .map(t => `<span class="type-badge">${t.type.name}</span>`)
        .join('');
    
    const statsGrid = document.getElementById('modalStatsGrid');
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
    
    // Resetear flip
    document.getElementById('modalCard').classList.remove('flipped');
    
    const modal = new bootstrap.Modal(document.getElementById('pokemonModal'));
    modal.show();
}

// BUSQUEDA Y FILTRO DE POKEMONES
// Filtrar por tipo
async function filterByType(type) {
    setLoading(true);
    currentOffset = 0;
    displayedPokemon = [];

    if (!type) {
        filteredPokemon = [...allPokemon];
    } else {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
            const data = await response.json();
            filteredPokemon = data.pokemon.map(p => ({
                name: p.pokemon.name,
                url: p.pokemon.url
            }));
        } catch (error) {
            console.error('Error filtrando por tipo:', error);
            filteredPokemon = [];
        }
    }

    document.getElementById('pokemonGrid').innerHTML = '';
    updateTotalCount();
    await loadMorePokemon();
}

//Busqueda por input (solo busca dentro de los disponibles en lo mostrado)
async function searchPokemon(query) {
    query = query.toLowerCase().trim();

    if (!query) {
        renderPokemonGrid(displayedPokemon, false);
        return;
    }

    const results = displayedPokemon.filter(pokemon => 
        pokemon.name.includes(query) || 
        pokemon.id.toString() === query
    );

    renderPokemonGrid(results, false);
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

 // Función para hacer flip
function toggleCardFlip() {
    document.getElementById('card').classList.toggle('flipped');
}

// Función para resetear la card a posición inicial
function resetCard() {
    document.getElementById('card').classList.remove('flipped');
}

// Configurar lISTENERS
function setupEventListeners() {
    // Scroll infinito
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadMorePokemon();
        }
    });

    // Filtro por tipo
    document.getElementById('typeFilter').addEventListener('change', (e) => {
        filterByType(e.target.value);
    });

    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchPokemon(e.target.value);
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPokemon(e.target.value);
        }
    });

    // Flip card en modal
    document.getElementById('modalCard').addEventListener('click', () => {
        document.getElementById('modalCard').classList.toggle('flipped');
    });
}

//INICIAR APLICACION
init();