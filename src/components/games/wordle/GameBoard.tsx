import { useEffect, useRef, useState } from "react";
import PageMeta from "../../utility/PageMeta";
import { WordleLogic } from "./GameLogic";
import { KeyBoard, KeyBoardResponse } from "./KeyBoard";
import { WorldLetter } from "./WordleLetter";
import { useDictionaryApi } from "../../../utility/word";
import GameWonLostModal from "../../modal/GameWonLostModal";
import { useEventListener } from "../../../hooks/useEventListener";
import {
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { BasicModal } from "../../modal/BasicModal";
import styles from "./style.module.css";

export interface IWordleGameBoardProps {}

export default function WordleGameBoard(props: IWordleGameBoardProps) {
  const refNotValidText = useRef<HTMLDivElement>(null);
  const [openModal, setOpenModal] = useState<boolean>(true);
  const [openInfoModal, setOpenInfoModal] = useState<boolean>(false);
  const [board, setBoard] = useState(new WordleLogic("hello"));
  const [wordMeaning, setWordMeaning] = useState<string>(
    "used as a greeting or to begin a phone conversation",
  );
  const [wrongWordGuessed, setWrongWordGuessed] = useState<string[]>([]);

  const { isWordValid, generateWord } = useDictionaryApi();

  const getInitialRandomWord = async () => {
    const word = await generateWord();
    const data = await isWordValid(word);
    if (data) {
      setBoard(new WordleLogic(word));
      setWordMeaning(data.definition);
    }
  };

  const handleResetGame = () => {
    if (board.currentAttempt === 1) return;
    getInitialRandomWord();
  };

  const checkWordValidity = async (word: string) => {
    let boardClone = createDeepClone();
    const isValid = await isWordValid(word);
    if (isValid) {
      let newBoard = boardClone.onEnter();
      if (newBoard) {
        setBoard(newBoard);
      }
    } else {
      handleShowError();
      if (!wrongWordGuessed.includes(word)) {
        setWrongWordGuessed((prev) => [...prev, word]);
      }
      return;
    }
  };

  const handleShowError = () => {
    refNotValidText.current!.style.display = "block";
    setTimeout(() => {
      refNotValidText.current!.style.display = "none";
    }, 2000);
  };

  const createDeepClone = () => {
    const boardClone: WordleLogic = Object.assign(
      Object.create(Object.getPrototypeOf(board)),
      board,
    );
    return boardClone;
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    getInitialRandomWord();
    setOpenModal(true);
  };

  const handleKeyDown = (event: KeyboardEvent | KeyBoardResponse) => {
    if (event instanceof KeyboardEvent) {
      if (event.currentTarget !== document.activeElement) return;
      if (
        (65 > event.keyCode || event.keyCode > 90) &&
        event.keyCode !== 8 &&
        event.keyCode !== 13
      ) {
        return;
      }
      if (event.repeat) return;
    }
    if (board.wrongGuessedLetters.includes(event.key)) return;
    switch (event.key) {
      case "Enter": {
        const word = WordleLogic.getWord(board.testWord, board.currentAttempt);
        if (word === "" || word.length !== 5) break;
        if (wrongWordGuessed.includes(word)) {
          handleShowError();
          break;
        }
        checkWordValidity(word);
        break;
      }
      case "Backspace": {
        let boardClone = createDeepClone();
        let newBoard = boardClone.onDelete();
        if (newBoard) {
          setBoard(newBoard);
        }
        break;
      }
      default: {
        let boardClone = createDeepClone();
        let newBoard = boardClone.onKeyPressed(event.key);
        if (newBoard) {
          setBoard(newBoard);
        }
        return;
      }
    }
  };

  useEventListener("keydown", handleKeyDown, document.body, false);

  useEffect(() => {
    getInitialRandomWord();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 lg:gap-8">
      <PageMeta title="ManyGames | Wordle" description="Play online wordle" />
      <div className="flex gap-4">
        <div className="flex flex-col-reverse gap-4 lg:flex-row">
          <div className="relative flex flex-col items-center gap-1 xl:gap-2">
            <div
              ref={refNotValidText}
              style={{ animation: `1500ms linear 500ms ${styles.hide}` }}
              className="absolute top-1/2 hidden rounded-md border border-gray-400 bg-white p-3 font-bold text-black"
            >
              Not a valid word
            </div>
            {board.testWord.map((row, rIndex) => {
              return (
                <div key={rIndex} className="flex flex-row gap-1">
                  {row.map((letter, cIndex) => {
                    return (
                      <WorldLetter
                        key={rIndex * board.correctWordLength + cIndex}
                        value={letter.value}
                        status={letter.status}
                        isActive={false}
                        colIndex={cIndex}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="flex w-full justify-end gap-4 lg:flex-col-reverse lg:justify-end">
            <div className="flex gap-4">
              <div className="flex w-full justify-end">
                <button
                  className="rounded-md bg-zinc-900 p-2 shadow-sm transition-colors duration-100 ease-in hover:bg-zinc-700 dark:bg-emerald-400  dark:ring-1 dark:ring-inset dark:ring-emerald-400/20 dark:hover:bg-emerald-400/80 dark:hover:ring-emerald-400 sm:px-4"
                  onClick={handleResetGame}
                >
                  <span className="hidden text-lg font-semibold text-white dark:text-zinc-900 sm:block">
                    New game
                  </span>
                  <ArrowPathIcon className="block h-6 w-6 text-white dark:text-zinc-900 sm:hidden" />
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex w-full justify-end">
                <button
                  onClick={() => setOpenInfoModal(true)}
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
                  aria-label="How to play"
                >
                  <InformationCircleIcon className="h-8 w-8 stroke-zinc-900 dark:stroke-emerald-300" />
                </button>
              </div>
            </div>

            <BasicModal
              title="Hints/ Clues"
              isOpen={openInfoModal}
              closeModal={setOpenInfoModal}
              className="max-w-xl"
            >
              <div className="mt-2 flex w-full flex-col gap-2 border-t border-emerald-500 p-2 text-black dark:text-white">
                <span className="text-sm font-thin">
                  In Wordle, players have six attempts to guess a five-letter
                  word selected by the game.
                </span>
                <div className="flex flex-row items-center gap-1 p-1">
                  <span className="rounded-md border border-gray-700 bg-emerald-300 p-2 dark:border-white dark:bg-emerald-500"></span>
                  <span>
                    Indicates that the guessed letter is in the word and in the
                    correct spot
                  </span>
                </div>
                <div className="flex flex-row items-center gap-1 p-1">
                  <span className="rounded-md border border-gray-700 bg-yellow-300 p-2 dark:border-white dark:bg-yellow-600"></span>
                  <span>
                    Indicates that the guessed letter is in the word but in the
                    wrong spot
                  </span>
                </div>
                <div className="flex flex-row items-center gap-1 p-1">
                  <span className="rounded-md border border-gray-700 bg-gray-400 p-2 dark:border-white dark:bg-gray-500"></span>
                  <span>
                    Indicates that the guessed letter is not in the word in any
                    spot
                  </span>
                </div>
              </div>
            </BasicModal>
          </div>
        </div>
      </div>
      <KeyBoard
        getValue={handleKeyDown}
        disabledKeys={board.wrongGuessedLetters}
      />
      {(board.hasWon() || board.hasLost()) && (
        <GameWonLostModal
          isOpen={openModal}
          closeModal={handleCloseModal}
          isWon={board.hasWon()}
        >
          <div className="mt-4">
            <div className="text-md mb-1 text-gray-500">
              <div>
                {board.hasLost() ? "Word was " : ""}
                <span className="text-2xl font-extrabold text-emerald-500">
                  {board.correctWord.charAt(0).toLocaleUpperCase() +
                    board.correctWord.substring(1)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-gray-500">
              Definition{" "}
              <span className="text-md font-semibold text-emerald-500">
                "
                {wordMeaning.replace(
                  wordMeaning[0],
                  wordMeaning[0].toLocaleUpperCase(),
                )}
                "
              </span>
            </div>
          </div>
        </GameWonLostModal>
      )}
    </div>
  );
}
