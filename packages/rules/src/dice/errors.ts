/** Position dans le texte saisi : indice de début (inclus) et de fin (exclu), à partir de 0. */
export interface Span {
  start: number;
  end: number;
}

/**
 * Codes d'erreur stables (CODE-16). L'interface traduit le message à partir du code et des
 * détails ; le message français de l'erreur sert de texte par défaut et aux logs.
 */
export type DiceSyntaxErrorCode =
  "EMPTY_EXPRESSION" | "EXPRESSION_TOO_LONG" | "UNEXPECTED_CHARACTER";

export type DiceSyntaxErrorDetails = Readonly<Record<string, string | number>>;

/** Erreur de saisie d'une expression de dés, localisée dans le texte saisi. */
export class DiceSyntaxError extends Error {
  override readonly name = "DiceSyntaxError";

  constructor(
    readonly code: DiceSyntaxErrorCode,
    message: string,
    /** Partie du texte en cause, pour la mettre en évidence dans l'interface. */
    readonly span: Span,
    readonly details: DiceSyntaxErrorDetails = {},
  ) {
    super(message);
  }
}
