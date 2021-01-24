import React,{useContext} from 'react';
import GameHeader from './GameHeader';
import PlayerInfoBox from './PlayerInfoBox';
import classnames from 'classnames';
import {AuthContext} from '../App';

const GameArea = () => {

    const ls = window.localStorage;
    let apiRestart = false;
    let testIsWin = null; // TODO: is a temporary solution becouse there is some problem with isWin state - it is all about rendering rounds colums;
    const {leftCash, setLeftCash, bet, setBet, isPlay, setIsPlay, round, setRound, setDoubleDown, isWin, setIsWin, rerender,setRerender}=useContext(AuthContext);

    //GETING DECKS FROM API AND SAVE THEM KEY TO LOCAL STORAGE - FOR THIS USAGE I PUT IT STIFFLY - DECK KEY:"I4T10VV791D3" VALID FOR 2 WEEKS.
    // const getDecks = async () => {
    //     await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6')
    //         .then(res => res.json())
    //         .then(data => ls.setItem('decksKey', JSON.stringify(data.deck_id)))   
    // }
    // getDecks();

    //COUNT VALUES MODULE FUNCTION:
    const countValues = (playerOrCroupierCards) => {
        //First we push each cards without AS and sort array. It is necessery to set AS value:
        let valuesArray = [];
        const cardsWitoutAS = [];
        const cards = JSON.parse(ls.getItem(playerOrCroupierCards));

        cards.forEach( element => {
            if(element.value==='ACE'){
                //DO NOTHING
            } else if( element.value==='KING'|| element.value==='QUEEN' || element.value==='JACK'){
                cardsWitoutAS.push(10);
            } else {
                cardsWitoutAS.push(parseInt(element.value));
            };
        });

        const sortedCards = cardsWitoutAS.sort((a, b) => a - b);
        sortedCards.forEach( element => valuesArray.push(element));
        //If array is empty we want to result be 0
        const firstSumming = sortedCards.length>0 ? sortedCards.reduce((prev, curr) => prev+curr) : 0;
        //End without ACE//

        cards.forEach( element => {
            //Check firstSumming value to set AS value: 1 or 11:
            if(element.value==='ACE'){
                if(firstSumming>=11){
                    valuesArray.push(1)
                } else if(firstSumming<11){
                    valuesArray.push(11)
                }
            };
        });

        const finalSumming = valuesArray.reduce((prev, curr) => prev+curr);
        valuesArray = [];
        return finalSumming
    };

    //SAVE ROUNDS HISTORY MODULE FUNCTION:
    const saveRoundsHistory = () => {
        let prevsRounds = JSON.parse(ls.getItem('roundsHistory'));
        const playerCards = JSON.parse(ls.getItem('playerCards'))?.map(card => card.value);
        const croupierCards = JSON.parse(ls.getItem('crupierCards'))?.map(card => card.value);
        if(prevsRounds===null){
            prevsRounds=[];
        };

        prevsRounds.push({round:round, playerCards:playerCards, croupierCards:croupierCards, bet:bet, isWin:testIsWin });
        ls.setItem('roundsHistory',JSON.stringify(prevsRounds));
    }


    //PLAY BTN//
    const handlePlay = async () =>{

        if(leftCash<=0){
            window.alert('You spent all your money. You can try to play again.');
            handleRestart();
            return
        };

        ls.removeItem('crupierCards');
        ls.removeItem('playerCards');

        let roundCounter = round;
        roundCounter++;

        if(roundCounter===6){
            //Saving score to scoresHistory and descending:
            let scoresHistory = JSON.parse(ls.getItem('scoresHistory'));
            if(scoresHistory===null){
                scoresHistory=[];
            } else if( typeof scoresHistory==='string'){
                JSON.parse(scoresHistory)
            }

            scoresHistory.push(leftCash);
            scoresHistory.sort((a,b)=> a-b).reverse();
            ls.setItem('scoresHistory',JSON.stringify(scoresHistory));

            handleRestart();
            window.alert('You finisch a game. You can check your score and play again :). If you must quit remember that game will be saved and you can back here any moment to get better score!')
            return
        };
        let result = window.prompt('What is your bet? Please press a number.'); 

        // eslint-disable-next-line eqeqeq
        while(parseInt(result) != result || parseInt(result)>leftCash){
            result = window.prompt('Please write correct number:');
        };
        
        result=parseInt(result);
        setLeftCash(leftCash-result);
        setRound(roundCounter);
        setBet(result);

        //Resuffle cards:
        await fetch('https://deckofcardsapi.com/api/deck/i4t10vv791d3/shuffle/')
            .catch(err=>{
                window.alert('CONNECTION FROM https://deckofcardsapi.com/ BROKES. SORRY, A GAME MUST BE RESTARTED...',err);     
                apiRestart=true;    
            });
        if(apiRestart){
            return handleRestart();  
        };
        
        //Starting cards for crupier:
        await fetch('https://deckofcardsapi.com/api/deck/i4t10vv791d3/draw/?count=2')
            .then(res => res.json())
            .then(data => ls.setItem('crupierCards', JSON.stringify(data.cards)))
            .catch(err=>{
                window.alert('CONNECTION FROM https://deckofcardsapi.com/ BROKES. SORRY, A GAME MUST BE RESTARTED...',err);     
                apiRestart=true;    
            });
        if(apiRestart){
            return handleRestart();  
        };

        //Starting cards for player:
        await fetch('https://deckofcardsapi.com/api/deck/i4t10vv791d3/draw/?count=2')
            .then(res => res.json())
            .then(data => ls.setItem('playerCards', JSON.stringify(data.cards)))
            .catch(err=>{
                window.alert('CONNECTION FROM https://deckofcardsapi.com/ BROKES. SORRY, A GAME MUST BE RESTARTED...',err);     
                apiRestart=true;    
            });
        if(apiRestart){
            return handleRestart();  
        };

        setIsPlay(true);
        setDoubleDown(true);

        ls.setItem('leftCash',leftCash-result);
        ls.setItem('rounds',roundCounter);
        ls.setItem('bet',result);
        ls.setItem('doubleDown',true);
        ls.setItem('isPlay',true);

        if(JSON.parse(ls.getItem('leftCash'))<JSON.parse(ls.getItem('bet'))){
            setDoubleDown(false);
            ls.setItem('doubleDown',false);
        }
    };

    //RESTART GAME BTN//
    const handleRestart = () => {

        setLeftCash(1000);
        setRound(0);
        setBet(0);        
        setIsPlay(false);
        setDoubleDown(false); 
        apiRestart=false;

        //Save scores history before ls clear:
        let scoresHistory = JSON.parse(ls.getItem('scoresHistory'));
        if(scoresHistory===null){
            scoresHistory=[];
        } else if( typeof scoresHistory==='string'){
            JSON.parse(scoresHistory);
        };
        ls.clear();

        ls.setItem('leftCash',1000);
        ls.setItem('rounds',0);
        ls.setItem('scoresHistory',JSON.stringify(scoresHistory));
        ls.setItem('doubleDown',false);
        ls.setItem('isPlay',false);
        ls.setItem('bet',0);

        window.location.reload();
    }

    const handleDoubleDown = () => {
        setBet(bet*2);
        setLeftCash(leftCash-bet);
        setDoubleDown(false);

        ls.setItem('doubleDown',false);
        ls.setItem('leftCash',leftCash-bet);
        ls.setItem('bet',bet*2);
    }
    
    //STAND BTN//
    const handleStand = async () =>{
   
        //Crupier takes cards until he got more than 16 value:
        while(countValues('crupierCards')<=countValues('playerCards') && countValues('crupierCards')<=16){            
            while(countValues('crupierCards')<=16){
                const croupierCards = JSON.parse(ls.getItem('crupierCards'));           
                await fetch('https://deckofcardsapi.com/api/deck/i4t10vv791d3/draw/?count=1')
                    .then(res => res.json())
                    .then(data => croupierCards.push(data.cards[0]))
                    // eslint-disable-next-line no-loop-func
                    .catch(err=>{
                        window.alert('CONNECTION FROM https://deckofcardsapi.com/ BROKES. SORRY, A GAME MUST BE RESTARTED...',err);     
                        apiRestart=true;    
                    });
                if(apiRestart){
                    return handleRestart();  
                }
    
                ls.setItem('crupierCards', JSON.stringify(croupierCards));       
            };
        };

        //Count who is winner: TODO: refactoring:
        const croupierResult = countValues('crupierCards');
        const playerResult = countValues('playerCards');
        if(croupierResult===playerResult){
            setLeftCash(leftCash+bet);
            setIsWin(null);
            ls.setItem('isWin',JSON.stringify(null));
            ls.setItem('leftCash',leftCash+bet);
            testIsWin=null
        } else if (croupierResult>playerResult && croupierResult<=21){  
            setLeftCash(leftCash);    
            setIsWin(false);
            ls.setItem('leftCash',leftCash);
            ls.setItem('isWin',false);
            testIsWin=false;
        } else if(croupierResult<playerResult || playerResult<=21){
            const countedCash=leftCash+bet+bet*0.5;
            setLeftCash(countedCash);
            setIsWin(true);
            ls.setItem('leftCash',countedCash);
            ls.setItem('isWin',true);
            testIsWin=true;
        };
        
        setIsPlay(false);
        setDoubleDown(false);    
        saveRoundsHistory();
        
        ls.setItem('doubleDown',false);
        ls.setItem('isPlay',false);
        ls.setItem('bet',0);
        setBet(0);
    }

    //HIT BTN//
    const handleHit = async () => {

        //Takes 1 card:
        const playerCards = JSON.parse(ls.getItem('playerCards'));           
        await fetch('https://deckofcardsapi.com/api/deck/i4t10vv791d3/draw/?count=1')
            .then(res => res.json())
            .then(data => playerCards.push(data.cards[0]))
            .then(() => ls.setItem('playerCards', JSON.stringify(playerCards)))
            .catch(err=>{
                window.alert('CONNECTION FROM https://deckofcardsapi.com/ BROKES. SORRY, A GAME MUST BE RESTARTED...',err);     
                apiRestart=true;    
            })
        if(apiRestart){
            return handleRestart();  
        }

        const playerResult = countValues('playerCards');
        if (playerResult>21){
            setIsWin(false);
            setIsPlay(false);      
            testIsWin=false; 
            saveRoundsHistory();

            setBet(0);
            ls.setItem('isPlay',false);
            ls.setItem('bet',0);
            ls.setItem('isWin',false);
        }    

        ls.setItem('doubleDown',false);
        setDoubleDown(false);
        setRerender(rerender ? false : true);
    }
    
    return (
        <div className='gameArea'>
            <GameHeader title='Crupier'/>
            <div className='table'>
                <div className={classnames('crupierCardsBox', { crupierCardsBoxVisible: !isPlay })}>
                    {JSON.parse(ls.getItem('crupierCards'))?.map( card => <div key={Math.random().toString(16)} className='cardContainer'><img key={card.id} className='card'  src={card.image} alt='card'></img></div>)}
                </div>
                <div className='startBtnBox'>
                    {isPlay ? <button onClick={handleRestart} className='startBtn'>Restart Game</button> : <button onClick={handlePlay} className='startBtn'>{round===5 ? 'Play again' : 'Play'}</button>}                    
                </div>
                <div className='yourCardsBox'>
                    {JSON.parse(ls.getItem('playerCards'))?.map( card => <div key={Math.random().toString(16)} className='cardContainer'><img key={card.id} className='card' src={card.image} alt='card'></img></div>)}
                </div>
            </div> 
            <PlayerInfoBox  handleDoubleDown={handleDoubleDown} handleStand={handleStand} handleHit={handleHit}/>
        </div>
    )
};

export default GameArea;