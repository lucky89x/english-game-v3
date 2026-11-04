shader_type spatial;
void fragment() {
	float plank = floor(UV.y * 9.0);
	float joint = smoothstep(0.035, 0.065, fract(UV.y*9.0));
	float grain = sin(UV.x*45.0 + sin(UV.y*25.0)*0.6)*0.025;
	ALBEDO = mix(vec3(0.12,0.07,0.035), vec3(0.36,0.23,0.12) + grain + sin(plank*4.3)*0.018, joint);
	ROUGHNESS = 0.9;
}
