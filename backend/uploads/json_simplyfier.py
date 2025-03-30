import json

def simplify_json(input_json):
    def remove_empty_values(d):
        if isinstance(d, dict):
            return {k: remove_empty_values(v) for k, v in d.items() if v not in (None, '', [], {}, ())}
        elif isinstance(d, list):
            return [remove_empty_values(v) for v in d if v not in (None, '', [], {}, ())]
        else:
            return d

    return remove_empty_values(input_json)

if __name__ == "__main__":
    input_file = '/Users/Agustin/wa/videoanalisis/VideoAnalysis/backend/uploads/matriz.json'
    output_file = '/Users/Agustin/wa/videoanalisis/VideoAnalysis/backend/uploads/matriz_semplyfied.json'

    with open(input_file, 'r') as f:
        data = json.load(f)

    simplified_data = simplify_json(data)

    with open(output_file, 'w') as f:
        json.dump(simplified_data, f, indent=4)