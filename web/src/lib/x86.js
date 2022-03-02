export const BRANCH_INSTRS = new Set(['jne', 'jo', 'js', 'jns', 'je', 'jz', 'jnz', 'jb', 'jnae', 'jc', 'jnb', 'jae', 'jnc', 'jbe', 'jna', 'ja', 'jnbe', 'jl', 'jnge', 'jge', 'jnl', 'jle', 'jng', 'jg', 'jnle', 'jp', 'jpe', 'jnp', 'jpo', 'jcxz', 'jecxz', 'jmp', 'jmpq'])
export const CALL_INSTRS = new Set(['call', 'callq'])
export const TRANSFER_INSTRS = new Set([...BRANCH_INSTRS, ...CALL_INSTRS, 'ret'])
