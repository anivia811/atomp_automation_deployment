import type { IDoctorCheck, AppiumLogger, DoctorCheckResult } from '@appium/types';
export declare class EnvVarAndPathCheck implements IDoctorCheck {
    private readonly varName;
    log: AppiumLogger;
    constructor(varName: string);
    diagnose(): Promise<DoctorCheckResult>;
    fix(): Promise<string>;
    hasAutofix(): boolean;
    isOptional(): boolean;
}
//# sourceMappingURL=common.d.ts.map