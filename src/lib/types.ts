

export interface ChaosEngineSettings {
  probChoice: Probability;               // -8 .. +8
  cfChoice: ChaosFactor;            // dropdown value (e.g. "Balanced")
  tensionChoice: Tension;          // dropdown value
  advanced: boolean;
}

export interface RollResult {
  hits: number;
  ones: number;
  sixes: number;
  yes: boolean;
  exceptional: "none" | "yes" | "no";
  suffix: "none" | "and" | "but";
  majorBoon: boolean;
  majorComplication: boolean;
  text: string;
  dice: number[];
}

export enum Exceptional {
	Minor = "Exceptional (Minor)",
	Major = "Exceptional (Major)"
}


export enum Probability {
    Inevitable =   "Inevitable",
    Certain =      "Certain",
    HasToBe =      "Has to Be",
    SureThing =    "Sure Thing",
    Probable =     "Probable",
    Likely =       "Likely",
    _5050 =        "50/50",
    Unlikely =     "Unlikely",
    Dubious =      "Dubious",
    NoWay =        "No Way",
    Ridiculous =   "Ridiculous",
    Impossible =   "Impossible",
    Unfathomable = "Unfathomable",
}
export enum ChaosFactor {
  Peaceful = "Peaceful",
  Serene = "Serene",
  Calm = "Calm",
  Stable = "Stable",
  Chaotic = "Chaotic",
  Havoc = "Havoc",
  Pandemonium = "Pandemonium",
}



export enum Tension {
    LockedIn =     "Locked In",    
    UnderControl = "Under Control",
    Coasting =     "Coasting",    
    Neutral =      "Neutral",     
    Tense =        "Tense",        
    GettingCrazy = "Getting Crazy",
    FullTilt =     "Full Tilt",     
}
// state container
export interface OracleState {
  cf: ChaosFactor;
  tension: Tension;
  probability: Probability;
}
